"""CMS open data [Part D: prescriber-level, by generic]: Medicare Part D prescribers, procedures, spend-by-drug, enrollment; Medicaid SDUD by state."""
from common import get, save, STATES
import collections, sys

B = "https://data.cms.gov/data-api/v1/dataset/"
DS = dict(partd_prov="9552739e-3d05-4c1b-8eff-ecabf391e2e5", partd_geo="c8ea3f8e-3a09-4fea-86f2-8902fb4b0920",
          phys_svc="92396110-2aed-4d63-a6a2-5d6207d46a29", phys_geo="6fea9d79-0129-4e4c-b1b8-23cd86a4f435",
          partd_spend="7e0b4365-fd63-4a29-8f5e-e0ac9f66a81b", mcaid_spend="be64fce3-e835-4589-b46b-024198e524a6",
          enroll="d7fabe1e-d19b-4333-9eff-e80e0643f2fd")

def pull(ds, filters, size=5000, cap=400000):
    out, off = [], 0
    while off < cap:
        p = {f"filter[{k}]": v for k, v in filters.items()}; p.update(size=size, offset=off)
        rows = get(B + DS[ds] + "/data", p, timeout=180)
        out += rows
        if len(rows) < size: break
        off += size
    return out

def num(x):
    try: return float(x)
    except Exception: return 0.0

# ---------- Part D: prescriber-level, by generic ----------
PARTD = {  # generic name in CMS file -> (ta, label)
  "Primidone": ("et", "primidone"),
  "Cannabidiol (Cbd)": ("dee", "cannabidiol"), "Fenfluramine HCl": ("dee", "fenfluramine"), "Stiripentol": ("dee", "stiripentol"),
  "Ganaxolone": ("dee", "ganaxolone"), "Rufinamide": ("dee", "rufinamide"), "Clobazam": ("dee", "clobazam"),
  "Cenobamate": ("dee", "cenobamate"), "Felbamate": ("dee", "felbamate"), "Vigabatrin": ("dee", "vigabatrin"),
}
NEURO = ("Neurology", "Clinical Neurophysiology", "Neuropsychiatry", "Pediatric Medicine", "Neurosurgery", "Psychiatry & Neurology", "Epilepsy")
prov = {"et": {}, "dee": {}}; spec = {"et": collections.defaultdict(lambda: collections.Counter()), "dee": collections.defaultdict(lambda: collections.Counter())}
state_prov = {"et": collections.defaultdict(lambda: collections.Counter()), "dee": collections.defaultdict(lambda: collections.Counter())}
from concurrent.futures import ThreadPoolExecutor
with ThreadPoolExecutor(8) as ex:
    pulled = dict(zip(PARTD, ex.map(lambda g: pull("partd_prov", {"Gnrc_Name": g}), PARTD)))
for g, (ta, lab) in PARTD.items():
    rows = pulled[g]
    print(g, len(rows), file=sys.stderr)
    for r in rows:
        c = num(r["Tot_Clms"]); t = r["Prscrbr_Type"]; s = r["Prscrbr_State_Abrvtn"]
        spec[ta][lab][t] += c
        spec[ta][lab + "__n"][t] += 1
        if s in STATES: state_prov[ta][lab][s] += 1
        is_neuro = any(k in t for k in NEURO)
        if ta == "et" and not is_neuro: continue  # keep only neuro specialists at HCP level for ET (PCP volume is summarized by specialty)
        p = prov[ta].setdefault(r["Prscrbr_NPI"], {"npi": r["Prscrbr_NPI"], "ln": r["Prscrbr_Last_Org_Name"].title(), "fn": r["Prscrbr_First_Name"].title(),
              "city": r["Prscrbr_City"].title(), "st": s, "spec": t, "rx": {}, "cost": 0})
        p["rx"][lab] = p["rx"].get(lab, 0) + int(c); p["cost"] += num(r["Tot_Drug_Cst"])
for ta in prov:
    rows = list(prov[ta].values())
    for r in rows: r["tot"] = sum(r["rx"].values()); r["cost"] = round(r["cost"])
    rows.sort(key=lambda r: -r["tot"])
    keep = rows[:6000] if ta == "et" else rows[:8000]
    save(f"hcp_partd_{ta}.json", {"n_total": len(rows), "rows": keep,
         "by_specialty": {k: dict(v.most_common(25)) for k, v in spec[ta].items()},
         "prescribers_by_state": {k: dict(v) for k, v in state_prov[ta].items()}})
