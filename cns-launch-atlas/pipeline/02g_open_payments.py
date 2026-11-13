"""CMS Open Payments (Sunshine Act): speaking, consulting and honoraria payments made to clinicians by companies with brands adjacent to the two markets, 2023-2025.

Pull:  General Payment Data by reporting company and nature of payment (resumable; raw rows cached in ATLAS_RAW).
Tag:   each row to a brand by product name; rows for a company's other products are dropped.
Write: data/open_payments.json  (per-clinician totals by market, brand, payment type and year; brand summaries).

Notes
- The sponsor has no records: Open Payments covers companies with a marketed, government-reimbursed product.
- Meals, travel, education, grants, royalties and ownership are not pulled. Research payments sit in a separate file and are not used.
- The site refuses unfamiliar client names, so requests use the default client name.
"""
import collections, json, os, re, time, urllib.parse, urllib.request
from common import DATA, RAW

B = "https://openpaymentsdata.cms.gov/api/1/datastore/query/"
GEN = {"2025": "fb0b1734-1410-429d-92f6-3f4b35218e5e", "2024": "e6b17c6a-2534-4207-a4a1-6746a14911ff", "2023": "fb3a65aa-c901-4a38-a813-b04b00dfa2a9"}
F, N = "applicable_manufacturer_or_applicable_gpo_making_payment_id", "nature_of_payment_or_transfer_of_value"
NAT = ["Consulting Fee",
       "Compensation for services other than consulting, including serving as faculty or as a speaker at a venue other than a continuing education program",
       "Honoraria",
       "Compensation for serving as faculty or as a speaker for a medical education program",
       "Compensation for serving as faculty or as a speaker for a non-accredited and noncertified continuing education program",
       "Compensation for serving as faculty or as a speaker for an accredited or certified continuing education program"]
SHORT = {NAT[0]: "consult", NAT[1]: "speak", NAT[2]: "honor", NAT[3]: "faculty", NAT[4]: "faculty", NAT[5]: "faculty"}
CO = {"100000186746": "Neurocrine", "100000000141": "Teva", "100000141529": "Acadia", "100000010911": "Insightec", "100000010913": "Insightec", "100000951823": "Cala Health",
      "100000000106": "Medtronic", "100000010383": "Medtronic", "100000010680": "Abbott", "100000005674": "Boston Scientific",
      "100000005637": "Jazz", "100000486813": "Jazz", "100000000073": "UCB", "100000010780": "UCB", "100000005475": "UCB", "100001081885": "Immedica/Marinus", "100000426811": "Biocodex",
      "100000726811": "SK Life Science", "100000806859": "Neurelis"}
# brand label, market, company, generic or description, product pattern (None = every product of that company)
BRANDS = [("Ingrezza", "et", "Neurocrine", "valbenazine · tardive dyskinesia", r"ingrezza"), ("Austedo", "et", "Teva", "deutetrabenazine · tardive dyskinesia", r"austedo"),
          ("Nuplazid", "et", "Acadia", "pimavanserin · Parkinson's psychosis", r"nuplazid"),
          ("Focused ultrasound", "et", "Insightec", "Insightec · incisionless thalamotomy", None), ("Wrist neurostimulation", "et", "Cala Health", "Cala Health · wrist device", None),
          ("DBS, Medtronic", "et", "Medtronic", "deep brain stimulation", r"percept|activa|sensight|brainsense|\bdbs\b|deep brain"),
          ("DBS, Abbott", "et", "Abbott", "deep brain stimulation", r"infinity|liberta|\bdbs\b|deep brain"),
          ("DBS, Boston Scientific", "et", "Boston Scientific", "deep brain stimulation", r"vercise|\bdbs\b|deep brain"),
          ("Epidiolex", "dee", "Jazz", "cannabidiol", r"epidiolex"), ("Fintepla", "dee", "UCB", "fenfluramine", r"fintepla"), ("Ztalmy", "dee", "Immedica/Marinus", "ganaxolone", r"ztalmy"),
          ("Diacomit", "dee", "Biocodex", "stiripentol", r"diacomit"), ("Xcopri", "dee", "SK Life Science", "cenobamate", r"xcopri"), ("Valtoco", "dee", "Neurelis", "diazepam nasal spray · rescue", r"valtoco")]
ROWS, DONE = os.path.join(RAW, "open_payments_rows.json"), os.path.join(RAW, "open_payments_done.json")


def page(ds, cid, off):
    p = {"limit": 500, "offset": off, "count": "true", "schema": "false", "keys": "true",
         "conditions[0][property]": F, "conditions[0][operator]": "=", "conditions[0][value]": cid,
         "conditions[1][property]": N, "conditions[1][operator]": "in"}
    for i, n in enumerate(NAT):
        p[f"conditions[1][value][{i}]"] = n
    url = B + ds + "/0?" + urllib.parse.urlencode(p)
    for a in range(5):
        try:
            return json.loads(urllib.request.urlopen(url, timeout=240).read())
        except Exception as e:  # noqa
            err = e; time.sleep(3 * (a + 1))
    print("  failed", cid, off, err, flush=True)
    return None


def pull():
    rows = json.load(open(ROWS)) if os.path.exists(ROWS) else []
    done = set(json.load(open(DONE))) if os.path.exists(DONE) else set()
    for yr, ds in GEN.items():
        for cid, co in CO.items():
            key = f"{yr}:{cid}"
            if key in done:
                continue
            off, got, ok = 0, [], True
            while True:
                d = page(ds, cid, off)
                if d is None:
                    ok = False; break
                res = d.get("results", [])
                for x in res:
                    got.append({"y": yr, "co": co, "npi": x["covered_recipient_npi"], "fn": x["covered_recipient_first_name"], "ln": x["covered_recipient_last_name"],
                                "city": x["recipient_city"], "st": x["recipient_state"], "type": x["covered_recipient_primary_type_1"], "spec": x["covered_recipient_specialty_1"],
                                "nat": SHORT.get(x[N], "other"), "amt": float(x["total_amount_of_payment_usdollars"] or 0),
                                "prod": [x.get(f"name_of_drug_or_biological_or_device_or_medical_supply_{i}", "") for i in range(1, 6) if x.get(f"name_of_drug_or_biological_or_device_or_medical_supply_{i}")],
                                "cat": x.get("product_category_or_therapeutic_area_1", "")})
                if len(res) < 500:
                    break
                off += 500; time.sleep(0.15)
            print(f"{yr} {co:18s} {len(got):6d} rows {'ok' if ok else 'INCOMPLETE'}", flush=True)
            if ok:
                rows += got; done.add(key)
                json.dump(rows, open(ROWS, "w")); json.dump(sorted(done), open(DONE, "w"))
    return rows, len(done) == len(GEN) * len(CO)


def group(spec, typ):
    # the taxonomy's parent category is "Psychiatry & Neurology" for both fields, so only the last (most specific) level is read
    leaf = (spec or "").split("|")[-1]
    neuro, psych = bool(re.search(r"Neurolog|Neurophysiolog|Epilep|Neurological Surgery|Neuromuscular", leaf)), bool(re.search(r"Psychiatr|Mental Health|Psych/", leaf))
    if neuro and not psych: return "neuro"
    if psych and not neuro: return "psych"
    return "other"


def build(rows, complete):
    rec = {"dee": {}, "et": {}}
    summ = {b[0]: {"ta": b[1], "co": b[2], "what": b[3], "n": 0, "amt": 0.0, "rows": 0, "neuro": 0.0, "y": collections.Counter()} for b in BRANDS}
    seen = {b[0]: set() for b in BRANDS}
    for r in rows:
        if not r["npi"]:
            continue
        txt = " ".join(r["prod"]).lower() + " | " + (r.get("cat") or "").lower()
        hit = next((b for b in BRANDS if b[2] == r["co"] and (b[4] is None or re.search(b[4], txt))), None)
        if not hit:
            continue
        b, ta = hit[0], hit[1]
        spec = (r["spec"] or "").split("|")[-1].strip()
        g = group(r["spec"], r["type"])
        d = rec[ta].setdefault(r["npi"], {"n": f'{r["fn"].title()} {r["ln"].title()}', "c": r["city"].title(), "s": r["st"], "sp": spec or r["type"], "g": g, "amt": 0.0, "b": collections.Counter(), "k": collections.Counter(), "y": collections.Counter()})
        d["amt"] += r["amt"]; d["b"][b] += r["amt"]; d["k"]["consult" if r["nat"] == "consult" else "speak"] += r["amt"]; d["y"][r["y"]] += r["amt"]
        s = summ[b]; s["amt"] += r["amt"]; s["rows"] += 1; s["y"][r["y"]] += r["amt"]; seen[b].add(r["npi"])
        if g == "neuro": s["neuro"] += r["amt"]
    for b, s in summ.items():
        s["n"] = len(seen[b]); s["amt"] = round(s["amt"]); s["neuro"] = round(s["neuro"]); s["y"] = {k: round(v) for k, v in sorted(s["y"].items())}
    for ta in rec:
        for d in rec[ta].values():
            d["amt"] = round(d["amt"]); d["b"] = {k: round(v) for k, v in d["b"].most_common()}; d["k"] = {k: round(v) for k, v in d["k"].items()}; d["y"] = {k: round(v) for k, v in sorted(d["y"].items())}
    out = {"meta": {"years": sorted(GEN), "complete": complete, "published": "2026-06-30", "source": "https://openpaymentsdata.cms.gov/",
                    "scope": "Consulting fees, honoraria and compensation for speaking or faculty work. Meals, travel, education, grants, royalties, ownership and research payments are excluded.",
                    "sponsor_note": "The sponsor of the two lead assets has no Open Payments records; reporting applies to companies with a marketed, government-reimbursed product."},
           "brands": [dict(label=b[0], **summ[b[0]]) for b in BRANDS], "rec": rec}
    json.dump(out, open(os.path.join(DATA, "open_payments.json"), "w"))
    for ta in rec:
        print(ta, len(rec[ta]), "clinicians; total", f'${sum(d["amt"] for d in rec[ta].values()):,.0f}')
    for s in out["brands"]:
        print(f'  {s["label"]:24s} {s["n"]:5d} clinicians  ${s["amt"]:>12,.0f}  neurology share {100 * s["neuro"] / max(1, s["amt"]):3.0f}%')


if __name__ == "__main__":
    rows, complete = pull()
    build(rows, complete)
