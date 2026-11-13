"""PubMed E-utilities -> publication trends + author-level KOL signals per therapeutic area (2016-2026)."""
from common import get, save, STATES
import collections, re, time, xml.etree.ElementTree as ET, sys

EU = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
Q = {
 "dee": {"core": '(SCN2A[tiab] OR SCN8A[tiab] OR "Nav1.2"[tiab] OR "Nav1.6"[tiab]) AND (epilep*[tiab] OR seizure*[tiab] OR encephalopath*[tiab])',
         "broad": '("developmental and epileptic encephalopath*"[tiab] OR "epileptic encephalopath*"[tiab] OR "Dravet"[tiab] OR "Lennox-Gastaut"[tiab] OR "CDKL5"[tiab] OR "SCN1A"[tiab] OR "KCNQ2"[tiab] OR "STXBP1"[tiab])'},
 "et":  {"core": '"essential tremor"[ti]', "broad": '"essential tremor"[tiab]'},
}
DATE = ' AND ("2016/01/01"[dp] : "2026/12/31"[dp])'
US_PAT = re.compile(r"\b(USA|U\.S\.A\.|United States)\b|, (" + "|".join(list(STATES.keys()) + list(STATES.values())) + r")\b[ ,.\d-]*(USA)?\.?$")

def ids(term):
    j = get(EU + "esearch.fcgi", {"db": "pubmed", "term": term + DATE, "retmax": 9999, "retmode": "json", "sort": "pub_date"})
    r = j["esearchresult"]; print(term[:50], r["count"], file=sys.stderr)
    return r["idlist"]

def fetch(pmids):
    out = []
    for i in range(0, len(pmids), 200):
        body = None
        for t in range(5):
            try:
                import urllib.request, urllib.parse
                data = urllib.parse.urlencode({"db": "pubmed", "id": ",".join(pmids[i:i+200]), "retmode": "xml"}).encode()
                body = urllib.request.urlopen(urllib.request.Request(EU + "efetch.fcgi", data=data), timeout=120).read(); break
            except Exception as e:
                time.sleep(2 * (t + 1))
        if not body: continue
        for art in ET.fromstring(body).iter("PubmedArticle"):
            mc = art.find("MedlineCitation"); a = mc.find("Article")
            yr = (a.findtext("Journal/JournalIssue/PubDate/Year") or (a.findtext("Journal/JournalIssue/PubDate/MedlineDate") or "")[:4] or "0")
            auths = []
            for au in a.findall("AuthorList/Author"):
                ln, fn = au.findtext("LastName"), au.findtext("ForeName")
                if not ln or not fn: continue
                auths.append((ln, fn, au.findtext("AffiliationInfo/Affiliation") or ""))
            out.append({"pmid": mc.findtext("PMID"), "year": int(yr) if yr.isdigit() else 0, "journal": a.findtext("Journal/ISOAbbreviation") or "",
                        "title": "".join(a.find("ArticleTitle").itertext()) if a.find("ArticleTitle") is not None else "",
                        "types": [p.text for p in a.findall("PublicationTypeList/PublicationType")], "authors": auths})
        time.sleep(0.4)
    return out

def akey(ln, fn):
    return (ln.lower().strip(), re.split(r"[ .-]", fn.strip().lower())[0])

for ta, qs in Q.items():
    core_ids = ids(qs["core"]); broad_ids = ids(qs["broad"])
    core = set(core_ids); allids = list(dict.fromkeys(core_ids + broad_ids))
    arts = fetch(allids)
    by_year = collections.defaultdict(lambda: {"all": 0, "core": 0, "trial": 0})
    A = {}
    for ar in arts:
        is_core = ar["pmid"] in core
        is_trial = any("Clinical Trial" in t or "Randomized" in t for t in ar["types"])
        is_guid = any(t in ("Practice Guideline", "Guideline", "Consensus Development Conference") for t in ar["types"]) or re.search(r"consensus|guideline|recommendation", ar["title"], re.I)
        if ar["year"]:
            y = by_year[ar["year"]]; y["all"] += 1; y["core"] += is_core; y["trial"] += is_trial
        n = len(ar["authors"])
        for i, (ln, fn, aff) in enumerate(ar["authors"]):
            k = akey(ln, fn)
            d = A.setdefault(k, {"ln": ln, "fn": fn, "n": 0, "core": 0, "lead": 0, "recent": 0, "trial": 0, "guid": 0, "aff": "", "affy": 0, "top": []})
            d["n"] += 1; d["core"] += is_core; d["trial"] += is_trial; d["guid"] += bool(is_guid)
            if i == 0 or i == n - 1: d["lead"] += 1
            if ar["year"] >= 2022: d["recent"] += 1
            if len(fn) > len(d["fn"]): d["fn"] = fn
            if aff and ar["year"] >= d["affy"]: d["aff"], d["affy"] = aff[:260], ar["year"]
            if (i == 0 or i == n - 1) and len(d["top"]) < 3: d["top"].append({"pmid": ar["pmid"], "t": ar["title"][:140], "y": ar["year"], "j": ar["journal"]})
    rows = []
    for d in A.values():
        d["us"] = bool(US_PAT.search(d["aff"]))
        d["score"] = round(d["n"] + 1.5 * d["core"] + 1.0 * d["lead"] + 0.5 * d["recent"] + 1.0 * d["trial"] + 2.0 * d["guid"], 1)
        rows.append(d)
    rows.sort(key=lambda d: -d["score"])
    jr = collections.Counter(a["journal"] for a in arts)
    save(f"pubmed_{ta}.json", {"n_articles": len(arts), "n_core": len(core), "n_authors": len(rows), "by_year": dict(sorted(by_year.items())),
                              "journals": jr.most_common(25), "authors": rows[:900],
                              "recent_core": [{"pmid": a["pmid"], "t": a["title"][:200], "y": a["year"], "j": a["journal"], "a": (a["authors"][0][0] if a["authors"] else "")} for a in arts if a["pmid"] in core][:120]})
