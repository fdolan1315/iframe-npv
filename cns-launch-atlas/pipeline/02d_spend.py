"""CMS open data [Spending by drug (national, multi-year)]: Medicare Part D prescribers, procedures, spend-by-drug, enrollment; Medicaid SDUD by state."""
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

# ---------- Spending by drug (national, multi-year) ----------
BRANDS = ["Epidiolex", "Fintepla", "Diacomit", "Ztalmy", "Xcopri", "Briviact", "Banzel", "Rufinamide", "Onfi", "Sympazan", "Clobazam", "Sabril", "Vigadrone", "Vigabatrin", "Felbatol",
          "Fycompa", "Aptiom", "Vimpat", "Lacosamide", "Zonisade", "Afinitor Disperz", "Nayzilam", "Valtoco", "Libervant", "Primidone", "Mysoline", "Propranolol HCl", "Propranolol HCl ER",
          "Inderal LA", "Topiramate", "Nuplazid", "Ingrezza", "Austedo", "Austedo XR", "Nurtec ODT", "Daybue", "Skyclarys", "Oxtellar XR", "Elepsia XR", "Motpoly XR", "Xenazine", "Gocovri", "Nourianz", "Botox", "Xeomin"]
spend = {}
for src in ("partd_spend", "mcaid_spend"):
    for b in BRANDS:
        for r in pull(src, {"Brnd_Name": b}):
            if r.get("Mftr_Name") != "Overall": continue
            yrs = {}
            for y in range(2020, 2025):
                if r.get(f"Tot_Spndng_{y}") not in (None, ""):
                    yrs[y] = {"spend": round(num(r[f"Tot_Spndng_{y}"])), "clms": round(num(r.get(f"Tot_Clms_{y}"))), "benes": round(num(r.get(f"Tot_Benes_{y}"))) if r.get(f"Tot_Benes_{y}") else None,
                              "unit": round(num(r.get(f"Avg_Spnd_Per_Dsg_Unt_Wghtd_{y}")), 3), "per_bene": round(num(r.get(f"Avg_Spnd_Per_Bene_{y}"))) if r.get(f"Avg_Spnd_Per_Bene_{y}") else None}
            spend.setdefault(b, {"generic": r["Gnrc_Name"]})[src.split("_")[0]] = yrs
save("spend_by_drug.json", spend)
