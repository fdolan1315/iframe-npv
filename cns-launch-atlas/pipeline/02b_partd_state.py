"""CMS open data [Part D: state-level by drug]: Medicare Part D prescribers, procedures, spend-by-drug, enrollment; Medicaid SDUD by state."""
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

# ---------- Part D: state-level by drug ----------
PARTD = {"Primidone": ("et", "primidone"), "Propranolol HCl": ("et", "propranolol"), "Cannabidiol (Cbd)": ("dee", "cannabidiol"), "Fenfluramine HCl": ("dee", "fenfluramine"), "Stiripentol": ("dee", "stiripentol"), "Ganaxolone": ("dee", "ganaxolone"), "Rufinamide": ("dee", "rufinamide"), "Clobazam": ("dee", "clobazam"), "Cenobamate": ("dee", "cenobamate"), "Felbamate": ("dee", "felbamate"), "Vigabatrin": ("dee", "vigabatrin"), "Topiramate": ("et", "topiramate")}
geo = collections.defaultdict(dict)
for g, (ta, lab) in PARTD.items():
    for r in pull("partd_geo", {"Gnrc_Name": g}):
        if r["Prscrbr_Geo_Lvl"] != "State": continue
        st = next((k for k, v in STATES.items() if v == r["Prscrbr_Geo_Desc"]), None)
        if not st: continue
        d = geo[lab].setdefault(st, {"clms": 0, "cost": 0, "benes": 0, "prs": 0})
        d["clms"] += num(r["Tot_Clms"]); d["cost"] += num(r["Tot_Drug_Cst"]); d["benes"] += num(r["Tot_Benes"]); d["prs"] += num(r["Tot_Prscrbrs"])
save("partd_state.json", geo)
