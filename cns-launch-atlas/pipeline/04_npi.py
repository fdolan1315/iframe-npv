"""NPPES NPI Registry -> specialist supply by state/city (child neurology, epilepsy, clinical neurophysiology, clinical genetics)."""
from common import get, save, STATES
import collections, sys
from concurrent.futures import ThreadPoolExecutor
TAX = {"2084N0402X": ("child_neuro", "Neurology with Special Qualifications in Child Neurology"), "2084E0001X": ("epilepsy", "Epilepsy"),
       "2084N0600X": ("clin_neurophys", "Clinical Neurophysiology"), "207SG0201X": ("clin_genetics", "Clinical Genetics (M.D.)")}
def pull(st, code, desc):
    seen = {}
    for skip in range(0, 1200, 200):
        j = get("https://npiregistry.cms.hhs.gov/api/", {"version": "2.1", "taxonomy_description": desc, "state": st, "limit": 200, "skip": skip, "enumeration_type": "NPI-1"})
        res = (j or {}).get("results", [])
        for r in res:
            if any(t["code"] == code for t in r["taxonomies"]):
                loc = next((a for a in r["addresses"] if a["address_purpose"] == "LOCATION"), r["addresses"][0])
                if loc.get("state") == st: seen[r["number"]] = (loc.get("city", "").title(), loc.get("postal_code", "")[:5])
        if len(res) < 200: break
    return st, code, seen
jobs = [(s, c, d) for s in STATES for c, (_, d) in TAX.items()]
out = {v[0]: {} for v in TAX.values()}; cities = {v[0]: collections.Counter() for v in TAX.values()}
with ThreadPoolExecutor(6) as ex:
    for st, code, seen in ex.map(lambda a: pull(*a), jobs):
        k = TAX[code][0]; out[k][st] = len(seen)
        for city, z in seen.values(): cities[k][f"{city}, {st}"] += 1
for k in out: print(k, sum(out[k].values()), file=sys.stderr)
save("npi_supply.json", {"by_state": out, "top_cities": {k: v.most_common(150) for k, v in cities.items()}})
