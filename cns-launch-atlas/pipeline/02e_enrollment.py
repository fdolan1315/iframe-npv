"""CMS open data [Medicare enrollment by state (latest full year)]: Medicare Part D prescribers, procedures, spend-by-drug, enrollment; Medicaid SDUD by state."""
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

# ---------- Medicare enrollment by state (latest full year) ----------
enr = {}
for y in ("2025", "2024"):
    rows = pull("enroll", {"YEAR": y, "MONTH": "Year", "BENE_GEO_LVL": "State"})
    if rows:
        for r in rows:
            if r["BENE_STATE_ABRVTN"] in STATES:
                enr[r["BENE_STATE_ABRVTN"]] = {"year": int(y), "tot": int(num(r["TOT_BENES"])), "ma": int(num(r["MA_AND_OTH_BENES"])), "aged": int(num(r["AGED_TOT_BENES"])), "dual": int(num(r["DUAL_TOT_BENES"])),
                    "partd": int(num(r.get("PRSCRPTN_DRUG_TOT_BENES"))), "pdp": int(num(r.get("PRSCRPTN_DRUG_PDP_BENES"))), "mapd": int(num(r.get("PRSCRPTN_DRUG_MAPD_BENES"))),
                    "a65_74": int(num(r["AGE_65_TO_69_BENES"]) + num(r["AGE_70_TO_74_BENES"])), "a75p": int(sum(num(r[k]) for k in ("AGE_75_TO_79_BENES","AGE_80_TO_84_BENES","AGE_85_TO_89_BENES","AGE_90_TO_94_BENES","AGE_GT_94_BENES")))}
        break
save("medicare_enrollment.json", enr)
