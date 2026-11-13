"""Assemble all pipeline outputs + curated research into the single app data bundle and inline it into dist/index.html."""
from common import load, save, DATA, ROOT, STATES
import csv, json, os, re, collections, datetime, sys

RES = os.environ.get("ATLAS_RESEARCH", os.path.join(ROOT, "research"))
POP = os.environ.get("ATLAS_POP", os.path.join(ROOT, "data", "pop2018.csv"))
def res(n):
    p = os.path.join(RES, n)
    return json.load(open(p)) if os.path.exists(p) else {}

# ---------------- state demographics ----------------
pop = collections.defaultdict(lambda: {"tot": 0, "u20": 0, "a40_64": 0, "a65": 0, "u5": 0})
for r in csv.DictReader(open(POP)):
    st, n, g = r["state"], int(r["population"]), r["agegroup"]
    if st not in STATES: continue
    lo = int(re.search(r"(\d+)", g).group(1))
    d = pop[st]; d["tot"] += n
    if lo < 20: d["u20"] += n
    if lo < 5: d["u5"] += n
    if 40 <= lo < 65: d["a40_64"] += n
    if lo >= 65: d["a65"] += n
US = {k: sum(p[k] for p in pop.values()) for k in ("tot", "u20", "a40_64", "a65", "u5")}

enr = load("medicare_enrollment.json"); npi = load("npi_supply.json")["by_state"]; partd = load("partd_state.json")
sdud = load("medicaid_sdud.json"); proc = load("procedures.json")
hcp = {ta: load(f"hcp_partd_{ta}.json") for ta in ("dee", "et")}
trials = {ta: load(f"trials_{ta}.json") for ta in ("dee", "et")}
pm = {ta: load(f"pubmed_{ta}.json") for ta in ("dee", "et")}

DEE_RX = re.compile(r"epilep|seizure|dravet|lennox|cdkl5|encephalopath|tuberous|spasm|scn\d|kcnq|stxbp|syngap", re.I)
trials["dee"] = [t for t in trials["dee"] if any(not g.startswith("drug:") for g in t["tags"]) or DEE_RX.search(" ".join(t["cond"]))]
trials["et"] = [t for t in trials["et"] if any(not g.startswith("drug:") for g in t["tags"]) or re.search(r"tremor", " ".join(t["cond"]), re.I)]

ACTIVE = {"RECRUITING", "ACTIVE_NOT_RECRUITING", "NOT_YET_RECRUITING", "ENROLLING_BY_INVITATION"}
def site_counts(ts):
    allc, act = collections.Counter(), collections.Counter()
    for t in ts:
        seen = set()
        for l in t["loc"]:
            if l["co"] == "United States" and l["s"] in STATES and (l["s"], l["f"], l["c"]) not in seen:
                seen.add((l["s"], l["f"], l["c"])); allc[l["s"]] += 1
                if t["status"] in ACTIVE: act[l["s"]] += 1
    return allc, act
sc = {ta: site_counts(trials[ta]) for ta in trials}

def sd(prod, st):
    yrs = sdud.get(prod, {})
    y = "2024" if "2024" in yrs else (sorted(yrs)[-1] if yrs else None)
    return (yrs.get(y, {}).get(st, {}) if y else {})
hcp_state = {ta: collections.Counter(r["st"] for r in hcp[ta]["rows"]) for ta in hcp}
fus_state = proc["geo"].get("0398T", {}); dbs_state = collections.Counter()
for code in ("61863", "61867"):
    for st, v in proc["geo"].get(code, {}).items():
        if st != "US": dbs_state[st] += v["svcs"]

states = {}
for st, name in STATES.items():
    p, e = pop[st], enr.get(st, {})
    states[st] = {
      "name": name, "pop": p["tot"], "u20": p["u20"], "u5": p["u5"], "a40_64": p["a40_64"], "a65": p["a65"],
      "mc_tot": e.get("tot"), "mc_ma": e.get("ma"), "mc_partd": e.get("partd"), "mc_dual": e.get("dual"), "mc_75p": e.get("a75p"),
      "child_neuro": npi["child_neuro"].get(st, 0), "epileptologists": npi["epilepsy"].get(st, 0), "neurophys": npi["clin_neurophys"].get(st, 0), "geneticists": npi["clin_genetics"].get(st, 0),
      "pd_primidone": round(partd.get("primidone", {}).get(st, {}).get("clms", 0)), "pd_propranolol": round(partd.get("propranolol", {}).get(st, {}).get("clms", 0)),
      "pd_primidone_prs": round(partd.get("primidone", {}).get(st, {}).get("prs", 0)),
      "pd_cbd": round(partd.get("cannabidiol", {}).get(st, {}).get("clms", 0)), "pd_clobazam": round(partd.get("clobazam", {}).get(st, {}).get("clms", 0)),
      "pd_rufinamide": round(partd.get("rufinamide", {}).get(st, {}).get("clms", 0)), "pd_cenobamate": round(partd.get("cenobamate", {}).get(st, {}).get("clms", 0)),
      "mcd_epidiolex_rx": sd("EPIDIOLEX", st).get("rx", 0), "mcd_epidiolex_amt": sd("EPIDIOLEX", st).get("amt", 0),
      "mcd_fintepla_rx": sd("FINTEPLA", st).get("rx", 0), "mcd_fintepla_amt": sd("FINTEPLA", st).get("amt", 0),
      "mcd_diacomit_rx": sd("DIACOMIT", st).get("rx", 0), "mcd_ztalmy_rx": sd("ZTALMY", st).get("rx", 0),
      "mcd_clobazam_rx": sd("CLOBAZAM", st).get("rx", 0) + sd("ONFI", st).get("rx", 0) + sd("SYMPAZAN", st).get("rx", 0),
      "mcd_rufinamide_rx": sd("RUFINAMIDE", st).get("rx", 0) + sd("BANZEL", st).get("rx", 0),
      "mcd_xcopri_rx": sd("XCOPRI", st).get("rx", 0), "mcd_primidone_rx": sd("PRIMIDONE", st).get("rx", 0),
      "sites_dee": sc["dee"][0][st], "sites_dee_active": sc["dee"][1][st], "sites_et": sc["et"][0][st], "sites_et_active": sc["et"][1][st],
      "fus_svcs": round(fus_state.get(st, {}).get("svcs", 0)), "dbs_svcs": round(dbs_state.get(st, 0)),
      "hcp_dee": hcp_state["dee"][st], "hcp_et": hcp_state["et"][st],
    }

# ---------------- institutions (trial sites) ----------------
GENERIC = re.compile(r"research site|clinical site|investigational site|clinical trial site|study site|site \d|^site|investigative site|local institution|for information", re.I)
def norm_fac(f):
    f = re.sub(r"\s+", " ", f or "").strip()
    f = re.sub(r"\s*\(.*?\)\s*", " ", f).strip(" ,")
    return f
def institutions(ts):
    inst = {}
    for t in ts:
        seen = set()
        for l in t["loc"]:
            if l["co"] != "United States" or l["s"] not in STATES or not l["f"] or GENERIC.search(l["f"]): continue
            f = norm_fac(l["f"]); k = (re.sub(r"[^a-z]", "", f.lower())[:40], l["s"])
            if k in seen: continue
            seen.add(k)
            d = inst.setdefault(k, {"name": f, "city": l["c"], "st": l["s"], "lat": l["lat"], "lon": l["lon"], "n": 0, "active": 0, "ind": 0, "sponsors": collections.Counter(), "ncts": []})
            d["n"] += 1; d["active"] += t["status"] in ACTIVE; d["ind"] += t["sclass"] == "INDUSTRY"
            if t["sclass"] == "INDUSTRY": d["sponsors"][t["sponsor"][:28]] += 1
            if len(d["ncts"]) < 40: d["ncts"].append(t["nct"])
    rows = sorted(inst.values(), key=lambda d: (-d["n"], d["name"]))[:220]
    for d in rows: d["sponsors"] = [s for s, _ in d["sponsors"].most_common(4)]
    return rows
inst = {ta: institutions(trials[ta]) for ta in trials}

# ---------------- KOLs ----------------
ST_RX = re.compile(r",\s*(" + "|".join(sorted(STATES.values(), key=len, reverse=True)) + r"|" + "|".join(STATES) + r")\b")
N2S = {v: k for k, v in STATES.items()}
INST_RX = re.compile(r"(University|Hospital|Clinic|Institute|College|School of Medicine|Medical Center|Health|Children's)", re.I)
def aff_parts(aff):
    m = None
    for m in ST_RX.finditer(aff): pass
    st = (N2S.get(m.group(1), m.group(1)) if m else None)
    segs = [s.strip() for s in aff.split(",")]
    cand = [s for s in segs if INST_RX.search(s) and not re.match(r"(Department|Division|Section|Dept)", s, re.I)]
    return (cand[0][:70] if cand else (segs[0][:70] if segs else "")), st
def nkey(ln, fn): return (re.sub(r"[^a-z]", "", ln.lower()), (re.sub(r"[^a-z]", "", fn.lower()) or "?")[0])
def kols(ta, curated):
    pi = collections.defaultdict(lambda: {"n": 0, "trials": []})
    for t in trials[ta]:
        for o in t["pi"]:
            nm = re.sub(r",.*$", "", o["n"] or "").strip(); parts = nm.split()
            if len(parts) < 2 or re.search(r"director|medical|clinical|study|trial|pharma|monitor|chief|officer|inc\b", nm, re.I): continue
            k = nkey(parts[-1], parts[0]); pi[k]["n"] += 1; pi[k]["trials"].append(t["nct"]); pi[k]["aff"] = o.get("a")
    rx = {nkey(r["ln"], r["fn"]) + (r["st"],): r for r in hcp[ta]["rows"]}
    cur = {}
    for c in curated:
        nm = re.sub(r",.*$", "", c.get("name", "")).strip(); parts = nm.split()
        if len(parts) >= 2: cur[nkey(parts[-1], parts[0])] = c
    out, used = [], set()
    for a in pm[ta]["authors"]:
        k = nkey(a["ln"], a["fn"]); instn, st = aff_parts(a["aff"])
        c = cur.get(k); p = pi.get(k); r = rx.get(k + (st,)) if st else None
        if c: used.add(k)
        score = a["score"] + (6 * min(p["n"], 5) if p else 0) + (15 if c else 0)
        out.append({"name": f'{a["fn"]} {a["ln"]}', "inst": (c or {}).get("institution") or instn, "st": (c or {}).get("state") or st, "us": a["us"] or bool(c),
                    "pubs": a["n"], "core": a["core"], "lead": a["lead"], "recent": a["recent"], "trialpubs": a["trial"], "guid": a["guid"],
                    "pi": p["n"] if p else 0, "pi_ncts": (p["trials"][:6] if p else []), "rx": (r["tot"] if r else None), "npi": (r["npi"] if r else None),
                    "curated": bool(c), "focus": (c or {}).get("focus"), "why": (c or {}).get("why"), "src": (c or {}).get("source_url"), "top": a["top"], "score": round(score, 1)})
    for k, c in cur.items():
        if k in used: continue
        p = pi.get(k)
        out.append({"name": re.sub(r",.*$", "", c["name"]), "inst": c.get("institution"), "st": c.get("state"), "us": True, "pubs": 0, "core": 0, "lead": 0, "recent": 0, "trialpubs": 0, "guid": 0,
                    "pi": p["n"] if p else 0, "pi_ncts": (p["trials"][:6] if p else []), "rx": None, "npi": None, "curated": True, "focus": c.get("focus"), "why": c.get("why"), "src": c.get("source_url"), "top": [], "score": 15 + (6 * p["n"] if p else 0)})
    out.sort(key=lambda d: -d["score"])
    return out[:450]

R = {"company": res("company_assets.json"), "dee": res("dee_market.json"), "et": res("et_market.json"), "payer": res("payer_analogs.json")}
def _clean(o):
    if isinstance(o, str):
        o = re.sub(r"\s*\((?:[^()]*, )?recalled[^()]*\)", "", o)
        o = re.sub(r"\s*\((?:date|approval date|launch date)?[^()]*background knowledge[^()]*\)", "", o)
        o = re.sub(r"\bnot (?:found|retrieved)(?: in (?:this )?(?:session|search|research)| this session| in material retrieved| in retrieved sources)?\b", "not available", o, flags=re.I)
        return o
    if isinstance(o, list): return [_clean(x) for x in o]
    if isinstance(o, dict): return {k: _clean(v) for k, v in o.items()}
    return o
R = _clean(R)
K = {"dee": kols("dee", R["dee"].get("kols", [])), "et": kols("et", R["et"].get("kols", []))}

# ---------------- trials slim ----------------
def tslim(t):
    us = [l for l in t["loc"] if l["co"] == "United States"]
    return {"nct": t["nct"], "title": t["title"], "acr": t["acr"], "status": t["status"], "start": t["start"], "pcd": t["pcd"], "type": t["type"], "phase": "/".join(p.replace("PHASE", "") for p in t["phase"]) or "—",
            "n": t["n"], "sponsor": t["sponsor"], "sclass": t["sclass"], "cond": t["cond"][:5], "iv": [i["n"] for i in t["iv"]][:5], "ivt": sorted(set(i["t"] for i in t["iv"] if i["t"])), "po": t["po"][:1],
            "res": t["hasRes"], "nloc": len(t["loc"]), "nus": len(us), "sts": sorted(set(l["s"] for l in us if l["s"] in STATES)), "nco": len(set(l["co"] for l in t["loc"])), "tags": t["tags"]}
T = {ta: sorted([tslim(t) for t in trials[ta]], key=lambda t: (t["start"] or ""), reverse=True) for ta in trials}

# ---------------- HCP slim ----------------
def hslim(rows, n):
    return [[r["npi"], f'{r["fn"]} {r["ln"]}', r["city"], r["st"], r["spec"], r["tot"], r["rx"], r["cost"]] for r in rows[:n]]
H = {"dee": {"n_total": hcp["dee"]["n_total"], "rows": hslim(hcp["dee"]["rows"], 3500), "by_specialty": hcp["dee"]["by_specialty"]},
     "et": {"n_total": hcp["et"]["n_total"], "rows": hslim(hcp["et"]["rows"], 3500), "by_specialty": hcp["et"]["by_specialty"]}}

# procedures -> center-level (city) aggregates + surgeon list
pc = collections.defaultdict(lambda: {"fus": 0, "dbs": 0, "names": set()})
for r in proc["providers"]:
    k = (r["city"], r["st"])
    if r["code"] in ("0398T", "61715"): pc[k]["fus"] += r["svcs"]; pc[k]["names"].add(f'{r["fn"]} {r["ln"]}')
    if r["code"] in ("61863", "61867"): pc[k]["dbs"] += r["svcs"]; pc[k]["names"].add(f'{r["fn"]} {r["ln"]}')
PC = sorted([{"city": k[0], "st": k[1], "fus": v["fus"], "dbs": v["dbs"], "surgeons": sorted(v["names"])[:8]} for k, v in pc.items() if v["fus"] + v["dbs"] > 0], key=lambda d: -(d["fus"] + d["dbs"]))

bundle = {
  "built": datetime.date.today().isoformat(), "states": states, "us": US, "geo": load("us_states_geo.json"),
  "trials": T, "inst": inst, "kols": K, "hcp": H, "proc": {"national": {k: v.get("US") for k, v in proc["geo"].items()}, "codes": proc["codes"], "centers": PC},
  "pubmed": {ta: {k: pm[ta][k] for k in ("n_articles", "n_core", "n_authors", "by_year", "journals", "recent_core")} for ta in pm},
  "spend": load("spend_by_drug.json"), "fda": load("openfda.json"), "npi_cities": load("npi_supply.json")["top_cities"],
  "partd_spec": {ta: hcp[ta]["by_specialty"] for ta in hcp}, "research": R,
  "sdud_years": {p: {y: {"rx": sum(v["rx"] for v in ys.values()), "amt": sum(v["amt"] for v in ys.values()), "q": max([v.get("q", 0) for v in ys.values()] or [0])} for y, ys in yy.items()} for p, yy in sdud.items()},
}
os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
_md = os.path.join(ROOT, "dist", "media")
bundle["media"] = {f[:-len(".captions.json")]: json.load(open(os.path.join(_md, f))) for f in sorted(os.listdir(_md)) if f.endswith(".captions.json")} if os.path.isdir(_md) else {}
save("bundle.json", bundle)
src = os.path.join(ROOT, "src")
if os.path.exists(os.path.join(src, "app.html")):
    html = open(os.path.join(src, "app.html")).read()
    html = html.replace("/*__CSS__*/", open(os.path.join(src, "app.css")).read())
    js = "".join(open(os.path.join(src, f)).read() + "\n" for f in sorted(os.listdir(src)) if f.endswith(".js"))
    html = html.replace("/*__JS__*/", js.replace("</script", "<\\/script"))
    import base64
    logo = open(os.path.join(ROOT, "design", "brand", "bios-logo-primary.svg"), "rb").read()
    import hashlib
    assert hashlib.sha256(logo).hexdigest() == "5fcda33c41dc4dd90fc6f61f0cd8b161f67a0fe2183e938055490f53d9f11664", "BIOS logo hash mismatch"
    html = html.replace("/*__LOGO__*/", "data:image/svg+xml;base64," + base64.b64encode(logo).decode())
    html = html.replace("/*__DATA__*/", json.dumps(bundle, separators=(",", ":"), ensure_ascii=False).replace("</", "<\\/"))
    out = os.path.join(ROOT, "dist", "index.html"); open(out, "w").write(html)
    print("built", out, f"{os.path.getsize(out)/1e6:.2f} MB")
