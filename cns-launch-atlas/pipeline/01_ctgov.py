"""ClinicalTrials.gov v2 API -> interventional/observational trial registry per therapeutic area."""
from common import get, save, NAME2ST
import collections

QUERIES = {
  "dee": ['SCN2A', 'SCN8A', '"developmental and epileptic encephalopathy"', '"epileptic encephalopathy"', '"Dravet syndrome"',
          '"Lennox-Gastaut"', '"CDKL5"', '"infantile spasms"', 'KCNQ2', 'STXBP1', 'SYNGAP1', '"tuberous sclerosis" AND seizures'],
  "et": ['"essential tremor"'],
}
INTR = {
  "dee": ["relutrigine", "PRAX-562", "elsunersen", "PRAX-222", "zorevunersen", "STK-001", "bexicaserin", "LP352", "ETX101", "NBI-921352", "soticlestat", "ganaxolone", "fenfluramine", "stiripentol"],
  "et": ["ulixacaltamide", "PRAX-944", "suvecaltamide", "JZP385", "SAGE-324", "CX-8998"],
}
API = "https://clinicaltrials.gov/api/v2/studies"

def fetch(term, key="query.cond"):
    out, token = [], None
    while True:
        p = {key: term, "pageSize": 200, "countTotal": "true"}
        if token: p["pageToken"] = token
        j = get(API, p)
        out += j.get("studies", [])
        token = j.get("nextPageToken")
        if not token: break
    return out

def slim(s, tag):
    ps = s["protocolSection"]; idm = ps["identificationModule"]; st = ps.get("statusModule", {})
    des = ps.get("designModule", {}); sp = ps.get("sponsorCollaboratorsModule", {})
    arms = ps.get("armsInterventionsModule", {}); loc = ps.get("contactsLocationsModule", {})
    locs = []
    for l in loc.get("locations", []):
        gp = l.get("geoPoint") or {}
        locs.append({"f": l.get("facility"), "c": l.get("city"), "s": NAME2ST.get(l.get("state"), l.get("state")) if l.get("country") == "United States" else l.get("state"),
                     "co": l.get("country"), "lat": gp.get("lat"), "lon": gp.get("lon"), "st": l.get("status")})
    return {
      "nct": idm["nctId"], "title": idm.get("briefTitle"), "acr": idm.get("acronym"),
      "status": st.get("overallStatus"), "start": (st.get("startDateStruct") or {}).get("date"),
      "pcd": (st.get("primaryCompletionDateStruct") or {}).get("date"), "cd": (st.get("completionDateStruct") or {}).get("date"),
      "type": des.get("studyType"), "phase": des.get("phases") or [], "n": (des.get("enrollmentInfo") or {}).get("count"),
      "sponsor": (sp.get("leadSponsor") or {}).get("name"), "sclass": (sp.get("leadSponsor") or {}).get("class"),
      "collab": [c.get("name") for c in sp.get("collaborators", [])],
      "cond": ps.get("conditionsModule", {}).get("conditions", []),
      "iv": [{"t": i.get("type"), "n": i.get("name")} for i in arms.get("interventions", [])],
      "pi": [{"n": o.get("name"), "a": o.get("affiliation"), "r": o.get("role")} for o in loc.get("overallOfficials", [])],
      "po": [o.get("measure") for o in ps.get("outcomesModule", {}).get("primaryOutcomes", [])][:3],
      "hasRes": s.get("hasResults", False), "loc": locs, "tags": [tag],
    }

for ta, terms in QUERIES.items():
    seen = collections.OrderedDict()
    for t in terms:
        rows = fetch(t)
        print(ta, t, len(rows))
        for s in rows:
            r = slim(s, t.strip('"'))
            if r["nct"] in seen: seen[r["nct"]]["tags"].append(r["tags"][0])
            else: seen[r["nct"]] = r
    for t in INTR[ta]:
        rows = fetch(t, "query.intr")
        print(ta, "intr", t, len(rows))
        for s in rows:
            r = slim(s, "drug:" + t)
            if r["nct"] in seen: seen[r["nct"]]["tags"].append(r["tags"][0])
            else: seen[r["nct"]] = r
    save(f"trials_{ta}.json", list(seen.values()))
