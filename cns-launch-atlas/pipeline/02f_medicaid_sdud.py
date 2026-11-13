"""CMS open data [Medicaid State Drug Utilization (state x product)]: Medicare Part D prescribers, procedures, spend-by-drug, enrollment; Medicaid SDUD by state."""
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

# ---------- Medicaid State Drug Utilization (state x product) ----------
SDUD = {"2025": "158a1baa-5506-400a-8ec3-97756f0b0536", "2024": "61729e5a-7aa8-448c-8903-ba3e0cd0ea3c", "2023": "d890d3a9-6b00-43fd-8b31-fcba4c8e2909"}
PROD = ["EPIDIOLEX", "FINTEPLA", "DIACOMIT", "ZTALMY", "XCOPRI", "BRIVIACT", "BANZEL", "RUFINAMIDE", "CLOBAZAM", "ONFI", "SYMPAZAN", "VIGABATRIN", "SABRIL", "VIGADRONE", "FELBAMATE", "PRIMIDONE"]
sd = collections.defaultdict(lambda: collections.defaultdict(lambda: collections.defaultdict(lambda: {"rx": 0, "amt": 0, "units": 0})))
for y, did in SDUD.items():
    for p in PROD:
        off = 0
        while True:
            j = get(f"https://data.medicaid.gov/api/1/datastore/query/{did}/0", {"limit": 5000, "offset": off, "count": "false", "results": "true", "schema": "false", "keys": "true",
                    "conditions[0][property]": "product_name", "conditions[0][value]": p[:10] + "%", "conditions[0][operator]": "LIKE"}, timeout=180)
            rows = j.get("results", [])
            for r in rows:
                if r["state"] not in STATES or r.get("suppression_used") == "true": continue
                d = sd[p][y][r["state"]]
                d["rx"] += int(num(r["number_of_prescriptions"])); d["amt"] += num(r["total_amount_reimbursed"]); d["units"] += num(r["units_reimbursed"])
                d.setdefault("q", set()).add(int(num(r["quarter"])))
            if len(rows) < 5000: break
            off += 5000
        print("sdud", y, p, sum(v["rx"] for v in sd[p][y].values()), file=sys.stderr)
out = {p: {y: {s: {"rx": v["rx"], "amt": round(v["amt"]), "units": round(v["units"]), "q": len(v.get("q", []))} for s, v in ys.items()} for y, ys in yy.items()} for p, yy in sd.items()}
save("medicaid_sdud.json", out)
