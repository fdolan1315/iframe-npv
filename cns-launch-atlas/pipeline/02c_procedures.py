"""CMS open data [Procedures]: Medicare Part D prescribers, procedures, spend-by-drug, enrollment; Medicaid SDUD by state."""
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

# ---------- Procedures ----------
HCPCS = {"61863": "DBS lead implant (first array)", "61867": "DBS lead implant w/ microelectrode recording (first array)", "0398T": "MR-guided focused ultrasound thalamotomy",
         "61715": "MR-guided focused ultrasound thalamotomy (2025 code)", "61885": "Neurostimulator pulse generator insertion (single array)", "61886": "Neurostimulator pulse generator insertion (2+ arrays)",
         "64568": "Vagus nerve stimulator implantation", "95977": "Neurostimulator programming, cranial nerve"}
procs, pgeo = [], collections.defaultdict(dict)
for code, desc in HCPCS.items():
    rows = pull("phys_svc", {"HCPCS_Cd": code})
    print(code, len(rows), file=sys.stderr)
    for r in rows:
        procs.append({"npi": r["Rndrng_NPI"], "ln": r["Rndrng_Prvdr_Last_Org_Name"].title(), "fn": r["Rndrng_Prvdr_First_Name"].title(), "city": r["Rndrng_Prvdr_City"].title(),
                      "st": r["Rndrng_Prvdr_State_Abrvtn"], "zip": r["Rndrng_Prvdr_Zip5"], "spec": r["Rndrng_Prvdr_Type"], "code": code, "pos": r["Place_Of_Srvc"],
                      "benes": int(num(r["Tot_Benes"])), "svcs": int(num(r["Tot_Srvcs"])), "pay": round(num(r["Avg_Mdcr_Pymt_Amt"]))})
    for r in pull("phys_geo", {"HCPCS_Cd": code}):
        if r["Rndrng_Prvdr_Geo_Lvl"] == "National":
            d = pgeo[code].setdefault("US", {"svcs": 0, "benes": 0, "prov": 0}); d["svcs"] += num(r["Tot_Srvcs"]); d["benes"] += num(r["Tot_Benes"]); d["prov"] += num(r["Tot_Rndrng_Prvdrs"])
        elif r["Rndrng_Prvdr_Geo_Lvl"] == "State":
            st = next((k for k, v in STATES.items() if v == r["Rndrng_Prvdr_Geo_Desc"]), None)
            if st:
                d = pgeo[code].setdefault(st, {"svcs": 0, "benes": 0, "prov": 0}); d["svcs"] += num(r["Tot_Srvcs"]); d["benes"] += num(r["Tot_Benes"]); d["prov"] += num(r["Tot_Rndrng_Prvdrs"])
save("procedures.json", {"codes": HCPCS, "providers": procs, "geo": pgeo})
