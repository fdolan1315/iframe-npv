"""openFDA -> label facts, approval history (Drugs@FDA) and FAERS post-marketing signal for marketed comparators."""
from common import get, save
import sys
DRUGS = {  # generic -> (brand, ta)
 "fenfluramine": ("Fintepla", "dee"), "cannabidiol": ("Epidiolex", "dee"), "stiripentol": ("Diacomit", "dee"), "ganaxolone": ("Ztalmy", "dee"),
 "rufinamide": ("Banzel", "dee"), "clobazam": ("Onfi", "dee"), "cenobamate": ("Xcopri", "dee"), "felbamate": ("Felbatol", "dee"), "vigabatrin": ("Sabril", "dee"),
 "everolimus": ("Afinitor Disperz", "dee"), "lacosamide": ("Vimpat", "dee"), "oxcarbazepine": ("Trileptal", "dee"), "phenytoin": ("Dilantin", "dee"), "carbamazepine": ("Tegretol", "dee"),
 "valproate": ("Depakote", "dee"), "brivaracetam": ("Briviact", "dee"), "topiramate": ("Topamax", "both"),
 "propranolol": ("Inderal LA", "et"), "primidone": ("Mysoline", "et"), "gabapentin": ("Neurontin", "et"), "onabotulinumtoxinA": ("Botox", "et"),
}
def first(x, n=1400):
    return (x[0][:n] if isinstance(x, list) and x else None)
out = {}
for g, (brand, ta) in DRUGS.items():
    rec = {"generic": g, "brand": brand, "ta": ta}
    j = get("https://api.fda.gov/drug/label.json", {"search": f'openfda.brand_name:"{brand}"', "limit": 1})
    if j and j.get("results"):
        r = j["results"][0]; o = r.get("openfda", {})
        rec.update(label_date=r.get("effective_time"), manufacturer=first(o.get("manufacturer_name"), 80), route=o.get("route"), appl=first(o.get("application_number"), 20),
                   pharm_class=o.get("pharm_class_epc"), indications=first(r.get("indications_and_usage")), boxed_warning=first(r.get("boxed_warning"), 900),
                   contraindications=first(r.get("contraindications"), 600), dosage=first(r.get("dosage_and_administration"), 900),
                   warnings=first(r.get("warnings_and_cautions") or r.get("warnings"), 1200), set_id=r.get("set_id"))
    if rec.get("appl"):
        j = get("https://api.fda.gov/drug/drugsfda.json", {"search": f'openfda.application_number:"{rec["appl"]}"', "limit": 1})
        if j and j.get("results"):
            d = j["results"][0]; subs = d.get("submissions", [])
            orig = [s for s in subs if s.get("submission_type") == "ORIG"]
            rec["sponsor"] = d.get("sponsor_name"); rec["approval_date"] = (orig[0].get("submission_status_date") if orig else None)
            rec["review_priority"] = (orig[0].get("review_priority") if orig else None)
            rec["n_supplements"] = len(subs)
            rec["efficacy_supplements"] = sorted([s.get("submission_status_date") for s in subs if s.get("submission_class_code") == "EFFICACY" and s.get("submission_status") == "AP"])[:12]
    term = brand.upper() if g not in ("propranolol", "primidone", "gabapentin", "phenytoin", "carbamazepine", "valproate", "topiramate", "oxcarbazepine", "lacosamide") else g.upper()
    fld = "patient.drug.openfda.brand_name" if term == brand.upper() else "patient.drug.openfda.generic_name"
    j = get("https://api.fda.gov/drug/event.json", {"search": f'{fld}:"{term}"', "count": "patient.reaction.reactionmeddrapt.exact", "limit": 12})
    if j and j.get("results"): rec["faers_top"] = [(x["term"].title(), x["count"]) for x in j["results"]]
    j = get("https://api.fda.gov/drug/event.json", {"search": f'{fld}:"{term}"', "count": "receivedate"})
    if j and j.get("results"):
        yrs = {}
        for x in j["results"]: yrs[x["time"][:4]] = yrs.get(x["time"][:4], 0) + x["count"]
        rec["faers_by_year"] = {y: c for y, c in yrs.items() if y >= "2016"}; rec["faers_total"] = sum(yrs.values())
    out[g] = rec; print(g, rec.get("approval_date"), rec.get("faers_total"), file=sys.stderr)
save("openfda.json", out)
