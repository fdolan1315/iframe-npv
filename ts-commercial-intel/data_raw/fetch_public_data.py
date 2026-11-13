#!/usr/bin/env python3
"""Fetch public datasets for the TS Commercial Intelligence app.

Standard library only. Writes one JSON file per source next to this script.

    python3 fetch_public_data.py            # everything
    python3 fetch_public_data.py faers sec  # only the named sources

Sources: ctgov labels shortages faers sdud pubmed sec nppes

Rules baked in:
  * No dollar amounts are requested or stored (Medicaid reimbursement columns
    are never selected).
  * Nothing is estimated. A failed source is written with an "error" key.
  * Generic User-Agent, a pause between calls, backoff on 429/5xx.
"""
import collections
import datetime
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "research-client/1.0"
PAUSE = 0.4  # seconds between calls (keeps NCBI under 3 requests/second)

AGENTS = [
    "guanfacine", "clonidine", "haloperidol", "pimozide", "aripiprazole",
    "risperidone", "fluphenazine", "ziprasidone", "topiramate",
    "tetrabenazine", "deutetrabenazine", "valbenazine",
]

# Reference brands tried, in order, when picking a representative label.
LABEL_BRANDS = {
    "guanfacine": ["Intuniv"],
    "clonidine": ["Kapvay", "Catapres"],
    "haloperidol": ["Haldol"],
    "pimozide": ["Orap"],
    "aripiprazole": ["Abilify"],
    "risperidone": ["Risperdal"],
    "fluphenazine": [],
    "ziprasidone": ["Geodon"],
    "topiramate": ["Topamax"],
    "tetrabenazine": ["Xenazine"],
    "deutetrabenazine": ["Austedo"],
    "valbenazine": ["Ingrezza"],
}

# Used only when no reference-brand label exists in openFDA: narrows the generic
# fallback to the formulation that corresponds to the missing brand.
LABEL_FALLBACK_FILTER = {
    "clonidine": ('indications_and_usage:"attention deficit"',
                  "newest generic label whose indications mention 'attention deficit' "
                  "(the extended-release, Kapvay-equivalent product; immediate-release "
                  "clonidine tablets and patches are labelled for hypertension only)"),
}

# Medicaid SDUD product_name is a 10-character upper-case field, so long
# names are truncated (ARIPIPRAZO, DEUTETRABE ...). Matching is by PREFIX.
SDUD_PREFIXES = {
    "guanfacine": ["GUANFAC", "INTUNIV", "TENEX"],
    "clonidine": ["CLONIDIN", "KAPVAY", "CATAPRES", "NEXICLON", "ONYDA", "DURACLON"],
    "haloperidol": ["HALOPERI", "HALDOL"],
    "pimozide": ["PIMOZ", "ORAP "],  # trailing space: bare ORAP also matches ORAPRED (prednisolone)
    "aripiprazole": ["ARIPIPRA", "ABILIFY", "ARISTADA"],
    "risperidone": ["RISPERID", "RISPERDAL", "PERSERIS", "UZEDY", "RYKINDO"],
    "fluphenazine": ["FLUPHENA"],
    "ziprasidone": ["ZIPRASID", "GEODON"],
    "topiramate": ["TOPIRAM", "TOPAMAX", "TROKENDI", "QUDEXY", "EPRONTIA"],
    "tetrabenazine": ["TETRABEN", "XENAZINE"],
    "deutetrabenazine": ["DEUTETRA", "AUSTEDO"],
    "valbenazine": ["VALBENAZ", "INGREZZA"],
}
SDUD_FIRST_YEAR = 2022

US_STATES = ("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN "
             "MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA "
             "WV WI WY PR").split()
STATE_NAME_TO_ABBR = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "District of Columbia": "DC",
    "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL",
    "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA",
    "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI",
    "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT",
    "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
    "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA",
    "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN",
    "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA",
    "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY", "Puerto Rico": "PR",
}

REQUEST_COUNT = 0


class NotFound(Exception):
    pass


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def http_json(url, body=None, tries=5, timeout=90):
    """GET (or POST json) -> parsed JSON. 404 raises NotFound. Retries 429/5xx."""
    global REQUEST_COUNT
    headers = {"User-Agent": UA, "Accept": "application/json"}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    last = None
    for attempt in range(tries):
        time.sleep(PAUSE)
        REQUEST_COUNT += 1
        try:
            req = urllib.request.Request(url, data=data, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise NotFound(url)
            last = "HTTP %s %s" % (e.code, e.read()[:200].decode("utf-8", "replace"))
            if e.code != 429 and e.code < 500:
                raise RuntimeError("%s for %s" % (last, url))
        except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError) as e:
            last = repr(e)
        time.sleep(2 ** attempt * 1.5)
    raise RuntimeError("gave up after %d tries: %s for %s" % (tries, last, url))


def q(params):
    return urllib.parse.urlencode(params, quote_via=urllib.parse.quote, safe='":[]+()')


def save(name, payload):
    path = os.path.join(HERE, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print("  wrote %s (%.1f KB)" % (name, os.path.getsize(path) / 1024.0))


def num(v):
    if v is None or v == "":
        return None
    f = float(v)
    return int(f) if f == int(f) else round(f, 3)


# ----------------------------------------------------------------- 1. CT.gov
def fetch_ctgov():
    base = "https://clinicaltrials.gov/api/v2/studies"
    cond = 'Tourette OR "Tic Disorders" OR "Tic Disorder"'
    fields = ",".join([
        "NCTId", "BriefTitle", "OverallStatus", "Phase", "StudyType", "Condition",
        "LeadSponsorName", "LeadSponsorClass", "InterventionName", "InterventionType",
        "EnrollmentCount", "EnrollmentType", "StartDate", "PrimaryCompletionDate",
        "CompletionDate", "LastUpdatePostDate", "HasResults", "LocationFacility",
        "LocationCity", "LocationState", "LocationCountry", "LocationStatus"])
    studies, token, total = [], None, None
    while True:
        p = {"query.cond": cond, "pageSize": 200, "countTotal": "true", "fields": fields}
        if token:
            p["pageToken"] = token
        d = http_json(base + "?" + urllib.parse.urlencode(p))
        total = d.get("totalCount", total)
        for s in d.get("studies", []):
            ps = s.get("protocolSection", {})
            idm, st, de = ps.get("identificationModule", {}), ps.get("statusModule", {}), ps.get("designModule", {})
            sp = ps.get("sponsorCollaboratorsModule", {}).get("leadSponsor", {})
            studies.append({
                "nctId": idm.get("nctId"),
                "briefTitle": idm.get("briefTitle"),
                "overallStatus": st.get("overallStatus"),
                "phases": de.get("phases", []),
                "studyType": de.get("studyType"),
                "conditions": ps.get("conditionsModule", {}).get("conditions", []),
                "leadSponsor": {"name": sp.get("name"), "class": sp.get("class")},
                "interventions": [{"name": i.get("name"), "type": i.get("type")}
                                  for i in ps.get("armsInterventionsModule", {}).get("interventions", [])],
                "enrollmentCount": de.get("enrollmentInfo", {}).get("count"),
                "enrollmentType": de.get("enrollmentInfo", {}).get("type"),
                "startDate": st.get("startDateStruct", {}).get("date"),
                "primaryCompletionDate": st.get("primaryCompletionDateStruct", {}).get("date"),
                "completionDate": st.get("completionDateStruct", {}).get("date"),
                "lastUpdatePostDate": st.get("lastUpdatePostDateStruct", {}).get("date"),
                "hasResults": s.get("hasResults"),
                "locations": [{"facility": l.get("facility"), "city": l.get("city"),
                               "state": l.get("state"), "country": l.get("country"),
                               "status": l.get("status")}
                              for l in ps.get("contactsLocationsModule", {}).get("locations", [])],
            })
        token = d.get("nextPageToken")
        if not token:
            break
    open_status = {"RECRUITING", "NOT_YET_RECRUITING", "ACTIVE_NOT_RECRUITING", "ENROLLING_BY_INVITATION"}
    by_status = collections.Counter(s["overallStatus"] for s in studies)
    by_phase = collections.Counter("/".join(s["phases"]) if s["phases"] else "NONE_LISTED" for s in studies)
    sites, trials = collections.Counter(), collections.defaultdict(set)
    unmapped = collections.Counter()
    for s in studies:
        if s["overallStatus"] not in open_status:
            continue
        for l in s["locations"]:
            if l["country"] != "United States":
                continue
            ab = STATE_NAME_TO_ABBR.get(l["state"] or "")
            if not ab:
                unmapped[l["state"] or "(blank)"] += 1
                continue
            sites[ab] += 1
            trials[ab].add(s["nctId"])
    save("ctgov_trials.json", {
        "fetched_at": now(),
        "source_urls": [base + "?query.cond=" + urllib.parse.quote(cond) +
                        "&pageSize=200&countTotal=true&fields=...&pageToken=<next>"],
        "caveats": [
            "Condition search is ClinicalTrials.gov's own term matching for: %s. It includes "
            "studies where Tourette/tics is one of several conditions and may include loosely "
            "related studies; check the 'conditions' list per study." % cond,
            "A study is listed once however many sites it has. Site counts are location rows, "
            "not unique institutions.",
            "'Open' in the summary means overallStatus in %s." % sorted(open_status),
            "Location-level status is often blank for studies that are not recruiting.",
            "Registry data is sponsor-reported and not verified.",
        ],
        "total_count_reported_by_api": total,
        "study_count": len(studies),
        "summary": {
            "by_status": dict(by_status.most_common()),
            "by_phase": dict(by_phase.most_common()),
            "open_statuses": sorted(open_status),
            "open_study_count": sum(1 for s in studies if s["overallStatus"] in open_status),
            "us_open_site_rows_by_state": dict(sorted(sites.items())),
            "us_open_studies_by_state": {k: len(v) for k, v in sorted(trials.items())},
            "us_open_site_rows_unmapped_state": dict(unmapped),
        },
        "studies": studies,
    })


# -------------------------------------------------------------- 2. FDA labels
def _label_record(r, strategy):
    of = r.get("openfda", {})
    ind = "\n".join(r.get("indications_and_usage", []) or [])
    box = "\n".join(r.get("boxed_warning", []) or [])
    return {
        "selection": strategy,
        "brand_name": of.get("brand_name", []),
        "generic_name": of.get("generic_name", []),
        "manufacturer": of.get("manufacturer_name", []),
        "application_number": of.get("application_number", []),
        "product_type": of.get("product_type", []),
        "route": of.get("route", []),
        "set_id": r.get("set_id"),
        "spl_version": r.get("version"),
        "effective_time": r.get("effective_time"),
        "indications_and_usage": ind,
        "has_boxed_warning": bool(box),
        "boxed_warning": box or None,
        "mentions_tourette": "tourette" in ind.lower(),
    }


def fetch_labels():
    lab, dfda = "https://api.fda.gov/drug/label.json", "https://api.fda.gov/drug/drugsfda.json"
    out, urls = {}, []
    rx = 'openfda.product_type:"HUMAN PRESCRIPTION DRUG"'
    for a in AGENTS:
        rec = {"label": None, "label_note": None}
        tried = []
        for b in LABEL_BRANDS[a]:
            s = 'openfda.brand_name:"%s" AND %s' % (b, rx)
            u = lab + "?" + q({"search": s, "sort": "effective_time:desc", "limit": 50})
            tried.append(u)
            try:
                d = http_json(u)
            except NotFound:
                continue
            # the brand itself, not a line extension (Abilify, not Abilify Maintena)
            exact = [r for r in d["results"]
                     if b.lower() in [n.lower() for n in r.get("openfda", {}).get("brand_name", [])]]
            if exact:
                rec["label"] = _label_record(
                    exact[0], "reference brand '%s' (exact brand-name match), newest effective_time" % b)
                rec["label"]["labels_matching_query"] = d["meta"]["results"]["total"]
                break
        if rec["label"] is None:
            base_s = 'openfda.generic_name:"%s" AND %s' % (a, rx)
            attempts = []
            if a in LABEL_FALLBACK_FILTER:
                f, why = LABEL_FALLBACK_FILTER[a]
                attempts.append((base_s + " AND " + f, why))
            attempts.append((base_s, "newest single-ingredient (oral preferred) generic label"))
            for s, why in attempts:
                u = lab + "?" + q({"search": s, "sort": "effective_time:desc", "limit": 25})
                tried.append(u)
                try:
                    d = http_json(u)
                except NotFound:
                    continue
                rs = d["results"]
                single = [r for r in rs if len(r.get("openfda", {}).get("substance_name", ["x"])) == 1]
                oral = [r for r in single if "ORAL" in r.get("openfda", {}).get("route", [])]
                pick = (oral or single or rs)[0]
                rec["label"] = _label_record(pick, "no reference-brand label in openFDA; " + why)
                rec["label"]["labels_matching_query"] = d["meta"]["results"]["total"]
                rec["label_note"] = ("Reference brand label(s) %s not found in openFDA under that exact "
                                     "brand name; a generic manufacturer's label is shown." % (
                                         LABEL_BRANDS[a] or "(no brand marketed)"))
                break
            if rec["label"] is None:
                rec["label_note"] = "No Rx label found in openFDA."
        urls += tried
        # generic-availability proxy from Drugs@FDA
        apps, skip = [], 0
        s = 'products.active_ingredients.name:"%s"' % a.upper()
        while True:
            u = dfda + "?" + q({"search": s, "limit": 100, "skip": skip})
            if skip == 0:
                urls.append(u)
            try:
                d = http_json(u)
            except NotFound:
                break
            apps += d["results"]
            skip += 100
            if skip >= d["meta"]["results"]["total"]:
                break
        def is_single(p):
            return len(p.get("active_ingredients", [])) == 1
        def marketed(p):
            return (p.get("marketing_status") or "").lower() not in ("discontinued", "")
        def summarize(sel):
            keep = [x for x in apps if any(sel(p) for p in x.get("products", []))]
            kinds = collections.Counter("".join(c for c in x["application_number"] if c.isalpha()) for x in keep)
            return {"applications": len({x["application_number"] for x in keep}),
                    "sponsors": len({x.get("sponsor_name") for x in keep}),
                    "by_application_type": dict(kinds)}
        rec["drugsfda"] = {
            "search": s,
            "all_products_including_combinations_and_discontinued": summarize(lambda p: True),
            "single_ingredient_any_status": summarize(is_single),
            "single_ingredient_not_discontinued": summarize(lambda p: is_single(p) and marketed(p)),
            "sponsor_names_single_ingredient_not_discontinued": sorted(
                {x.get("sponsor_name") for x in apps
                 if any(is_single(p) and marketed(p) for p in x.get("products", []))}),
        }
        out[a] = rec
        print("  labels:", a, "->", (rec["label"] or {}).get("brand_name"))
    save("openfda_labels.json", {
        "fetched_at": now(),
        "source_urls": urls,
        "caveats": [
            "One label per agent is a representative, not the only label. Other formulations of the "
            "same molecule (e.g. immediate vs extended release, injectables) can carry different "
            "indications and boxed warnings.",
            "mentions_tourette is a literal case-insensitive search for 'tourette' in the "
            "indications_and_usage text of the selected label only.",
            "Where openFDA holds no label for the reference brand, the newest generic label is shown "
            "and 'selection' says so.",
            "Drugs@FDA counts are application records with a matching active ingredient name. "
            "'not_discontinued' means at least one product in the application has a marketing status "
            "other than Discontinued (includes Prescription, Over-the-counter and tentative statuses). "
            "It is a proxy for generic availability, not a count of products actually on the market.",
            "Sponsor names are as recorded by FDA; the same company can appear under several spellings.",
        ],
        "agents": out,
    })


# ----------------------------------------------------------- 3. FDA shortages
def fetch_shortages():
    base = "https://api.fda.gov/drug/shortages.json"
    out, urls = {}, []
    meta = None
    for a in AGENTS:
        recs, skip = [], 0
        while True:
            u = base + "?" + q({"search": 'generic_name:"%s"' % a, "limit": 100, "skip": skip})
            if skip == 0:
                urls.append(u)
            try:
                d = http_json(u)
            except NotFound:
                break
            meta = d["meta"].get("last_updated")
            for r in d["results"]:
                recs.append({k: r.get(k) for k in (
                    "generic_name", "proprietary_name", "presentation", "package_ndc", "status",
                    "availability", "shortage_reason", "company_name", "dosage_form",
                    "therapeutic_category", "initial_posting_date", "update_date", "update_type",
                    "change_date", "discontinued_date", "related_info")})
            skip += 100
            if skip >= d["meta"]["results"]["total"]:
                break
        out[a] = {"record_count": len(recs),
                  "status_counts": dict(collections.Counter(r["status"] for r in recs)),
                  "records": recs}
        print("  shortages:", a, len(recs))
    save("openfda_shortages.json", {
        "fetched_at": now(),
        "source_urls": urls,
        "openfda_last_updated": meta,
        "caveats": [
            "openFDA mirrors FDA's drug shortage database. A record is one presentation (package) from "
            "one company, so one shortage can be many records.",
            "record_count 0 means the search returned no matches (HTTP 404 'No matches found') on the "
            "fetch date; it is not a statement that supply is unconstrained.",
            "Records include resolved and discontinued entries as well as current shortages; use 'status'.",
            "Search is a phrase match of the agent name inside generic_name, so combination products "
            "would be included if listed.",
        ],
        "agents": out,
    })


# --------------------------------------------------------------- 4. FDA FAERS
def fetch_faers():
    base = "https://api.fda.gov/drug/event.json"
    ped = "patient.patientonsetage:[0 TO 17] AND patient.patientonsetageunit:801"
    out, urls, last = {}, [], None

    def block(search):
        b = {"filter": search}
        u1 = base + "?" + q({"search": search, "limit": 1})
        u2 = base + "?" + q({"search": search, "count": "patient.reaction.reactionmeddrapt.exact", "limit": 20})
        urls.extend([u1, u2])
        try:
            d = http_json(u1)
            b["total_reports"] = d["meta"]["results"]["total"]
            b["openfda_last_updated"] = d["meta"].get("last_updated")
            d = http_json(u2)
            b["top_reactions"] = [{"term": r["term"], "reports": r["count"]} for r in d["results"]]
        except NotFound:
            b.setdefault("total_reports", 0)
            b.setdefault("top_reactions", [])
        except RuntimeError as e:
            b["error"] = str(e)
        return b

    for a in AGENTS:
        drug = ('(patient.drug.openfda.generic_name:"%s" OR '
                'patient.drug.activesubstance.activesubstancename:"%s")' % (a, a))
        out[a] = {"all_ages": block(drug), "under_18": block(drug + " AND " + ped)}
        last = out[a]["all_ages"].get("openfda_last_updated") or last
        print("  faers:", a, out[a]["all_ages"].get("total_reports"), out[a]["under_18"].get("total_reports"))
    save("openfda_faers.json", {
        "fetched_at": now(),
        "source_urls": urls,
        "openfda_last_updated": last,
        "pediatric_filter": ped + "  (onset age 0-17 where the age unit code is 801 = years; reports with "
                                  "age missing or given in months/days/decades are NOT counted)",
        "caveats": [
            "These are spontaneous adverse event reports submitted to FDA (FAERS). They are not "
            "incidence or rates, do not establish that the drug caused the event, and cannot be used "
            "to compare safety between drugs. Reporting volume tracks how widely and how long a drug "
            "has been used, publicity, and litigation.",
            "A report is counted if the agent appears ANYWHERE in its drug list (suspect, concomitant "
            "or interacting). openFDA cannot restrict a count to reports where the agent was the "
            "suspect drug in one query without mixing roles across drugs.",
            "The drug match is the union of two fields: the openFDA-harmonized generic name and the "
            "reported active substance name. Neither is complete alone (active substance is mostly "
            "populated on reports from about 2014 onward; the harmonized name is missing for some "
            "products - deutetrabenazine returns zero on it). Salts and combination products "
            "containing the agent are included; reports that only give an unrecognized product name "
            "are missed.",
            "A report can list several reactions, so reaction counts add up to more than total reports. "
            "Many top terms describe the underlying condition or reporting artefacts (e.g. 'Drug "
            "ineffective', 'Off label use').",
            "Duplicate reports exist in FAERS and are not removed.",
            "Reports are for all uses of the drug, not Tourette syndrome specifically.",
            "The under-18 block undercounts paediatric reports because age is often missing.",
        ],
        "agents": out,
    })


# ------------------------------------------------------------ 5. Medicaid SDUD
def fetch_sdud():
    cat = "https://data.medicaid.gov/api/1/metastore/schemas/dataset/items?show-reference-ids=false"
    qbase = "https://data.medicaid.gov/api/1/datastore/query/%s/0"
    datasets = {}
    for x in http_json(cat):
        t = x.get("title", "")
        if t.startswith("State Drug Utilization Data ") and t[-4:].isdigit() and int(t[-4:]) >= SDUD_FIRST_YEAR:
            datasets[int(t[-4:])] = {"id": x["identifier"], "modified": x.get("modified")}
    rows = collections.defaultdict(lambda: {"rx": 0, "units": 0, "ndc_rows": 0, "suppressed_rows": 0})
    products = collections.defaultdict(lambda: {"rx": 0, "units": 0, "ndc_rows": 0, "suppressed_rows": 0})
    errors, raw_groups = [], 0
    sums = [
        {"expression": {"operator": "sum", "operands": ["number_of_prescriptions"]}, "alias": "rx"},
        {"expression": {"operator": "sum", "operands": ["units_reimbursed"]}, "alias": "units"},
        {"expression": {"operator": "count", "operands": ["ndc"]}, "alias": "n"}]

    def grouped(year, agent, dims, extra_conditions):
        """One server-side GROUP BY over every prefix of an agent (each call scans the table)."""
        name_match = {"groupOperator": "or", "conditions": [
            {"property": "product_name", "value": p + "%", "operator": "like"}
            for p in SDUD_PREFIXES[agent]]}
        got, offset = [], 0
        while True:
            body = {"properties": dims + sums, "conditions": extra_conditions + [name_match],
                    "groupings": dims, "sorts": [{"property": p, "order": "asc"} for p in dims],
                    "limit": 500, "offset": offset, "schema": False, "keys": True, "count": False}
            res = http_json(qbase % datasets[year]["id"], body=body, timeout=240).get("results", [])
            got += res
            offset += 500
            if len(res) < 500:
                return got

    def one(job):
        year, agent = job
        try:
            by_state = grouped(year, agent, ["state", "year", "quarter", "suppression_used"], [])
            by_prod = grouped(year, agent, ["product_name", "suppression_used"],
                              [{"property": "state", "value": "XX", "operator": "<>"}])
            return job, by_state, by_prod, None
        except (RuntimeError, NotFound) as e:
            return job, [], [], str(e)

    def add(tgt, r):
        n = int(r["n"])
        tgt["ndc_rows"] += n
        if str(r["suppression_used"]).lower() == "true":
            tgt["suppressed_rows"] += n
        tgt["rx"] += num(r["rx"]) or 0
        tgt["units"] += num(r["units"]) or 0

    import concurrent.futures
    jobs = [(y, a) for y in sorted(datasets) for a in AGENTS]
    # 3 parallel requests: each query is a ~10 s full-table scan on the server
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for (year, agent), by_state, by_prod, err in pool.map(one, jobs):
            if err:
                errors.append({"year": year, "agent": agent, "error": err})
            for r in by_state:
                raw_groups += 1
                add(rows[(agent, r["state"], int(r["year"]), int(r["quarter"]))], r)
            for r in by_prod:
                raw_groups += 1
                add(products[(agent, year, r["product_name"].strip(), False)], r)
            print("  sdud:", year, agent, len(by_state), len(by_prod), err or "")

    def pack(k, v):
        hidden = v["suppressed_rows"] == v["ndc_rows"]  # every row suppressed: unknown, not zero
        return {"agent": k[0], "state": k[1], "year": k[2], "quarter": k[3],
                "number_of_prescriptions": None if hidden else num(v["rx"]),
                "units_reimbursed": None if hidden else num(v["units"]),
                "ndc_rows": v["ndc_rows"], "suppressed_rows_excluded": v["suppressed_rows"]}
    state_rows = [pack(k, v) for k, v in sorted(rows.items()) if k[1] != "XX"]
    xx_rows = [pack(k, v) for k, v in sorted(rows.items()) if k[1] == "XX"]
    quarters = collections.defaultdict(set)
    for r in state_rows:
        quarters[r["year"]].add(r["quarter"])
    prod_rows = [{"agent": k[0], "year": k[1], "product_name": k[2],
                  "scope": "sum_of_state_rows_excluding_XX",
                  "number_of_prescriptions": num(v["rx"]), "units_reimbursed": num(v["units"]),
                  "ndc_rows": v["ndc_rows"], "suppressed_rows_excluded": v["suppressed_rows"]}
                 for k, v in sorted(products.items())]
    supp_by = collections.defaultdict(lambda: [0, 0])
    for r in state_rows:
        supp_by[(r["agent"], r["year"])][0] += r["ndc_rows"]
        supp_by[(r["agent"], r["year"])][1] += r["suppressed_rows_excluded"]
    save("medicaid_sdud.json", {
        "fetched_at": now(),
        "source_urls": [cat, "POST " + qbase % "<dataset id>" +
                        " (two grouped queries per agent and year: by state/quarter/suppression flag, "
                        "and by product_name/suppression flag excluding state XX; each sums "
                        "number_of_prescriptions and units_reimbursed and counts rows where "
                        "product_name LIKE '<PREFIX>%' for any listed prefix)"],
        "datasets": {str(y): datasets[y] for y in sorted(datasets)},
        "product_name_prefix_match_list": SDUD_PREFIXES,
        "quarters_present_by_year": {str(y): sorted(v) for y, v in sorted(quarters.items())},
        "caveats": [
            "Medicaid only (fee-for-service and managed care combined). Not all-payer volume.",
            "No dollar columns were requested or stored.",
            "Counts are for every use of the drug, not Tourette syndrome. Most of these agents are "
            "used mainly for other conditions (ADHD, hypertension, schizophrenia, bipolar disorder, "
            "epilepsy, migraine, Huntington chorea, tardive dyskinesia).",
            "CMS suppresses any NDC/state/quarter row with fewer than 11 prescriptions. Suppressed rows "
            "have no counts and are EXCLUDED from the sums, so true volume is higher, especially for "
            "low-volume drugs and small states. 'suppressed_rows_excluded' out of 'ndc_rows' shows how "
            "much of each cell was hidden.",
            "A cell where every row was suppressed has number_of_prescriptions and units_reimbursed "
            "set to null (unknown), never 0.",
            "Products are matched by PREFIX on SDUD's 10-character product_name field (long names are "
            "truncated, e.g. ARIPIPRAZO). Names entered by labelers vary; see 'product_breakdown' for "
            "exactly which names were captured. Products whose SDUD name does not start with a listed "
            "prefix are missed.",
            "All formulations are pooled: e.g. clonidine includes tablets, patches, ER and injection; "
            "aripiprazole and risperidone include long-acting injectables (Abilify Maintena, Aristada, "
            "Risperdal Consta, Perseris, Uzedy, Rykindo); guanfacine includes IR and ER.",
            "units_reimbursed mixes unit types (tablets, mL, patches) and must not be compared across "
            "formulations or agents.",
            "State 'XX' rows are CMS's national totals and are kept separately in 'national_xx_rows'; "
            "they are not in 'rows'. XX totals can differ from the sum of states because suppression "
            "is applied per row.",
            "Recent years are revised by states after first publication; the latest year is partial "
            "(see quarters_present_by_year).",
            "units_reimbursed is a quantity of drug units, not money, despite the name.",
        ],
        "errors": errors,
        "row_count": len(state_rows),
        "grouped_api_rows_read": raw_groups,
        "suppression_summary_state_rows": [
            {"agent": a, "year": y, "ndc_rows": v[0], "suppressed_rows_excluded": v[1]}
            for (a, y), v in sorted(supp_by.items())],
        "rows": state_rows,
        "national_xx_rows": xx_rows,
        "product_breakdown": prod_rows,
    })


# ------------------------------------------------------------------ 6. PubMed
def fetch_pubmed():
    es = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    su = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    ts = '"Tourette Syndrome"[MeSH Terms]'
    urls = []

    def search(term, retmax=0):
        u = es + "?" + urllib.parse.urlencode({"db": "pubmed", "term": term, "retmode": "json",
                                               "retmax": retmax, "sort": "pub_date"})
        urls.append(u)
        r = http_json(u)["esearchresult"]
        if "ERROR" in r:
            raise RuntimeError(r["ERROR"])
        return int(r["count"]), r.get("idlist", [])

    def agent_block(a):
        term = "%s AND %s" % (a, ts)
        b = {"query": term}
        try:
            b["total"], ids = search(term, 5)
            b["randomized_controlled_trials"], _ = search(term + " AND Randomized Controlled Trial[Publication Type]")
            b["meta_analyses_or_systematic_reviews"], _ = search(
                term + " AND (Meta-Analysis[Publication Type] OR Systematic Review[Publication Type])")
            b["most_recent"] = []
            if ids:
                u = su + "?" + urllib.parse.urlencode({"db": "pubmed", "id": ",".join(ids), "retmode": "json"})
                urls.append(u)
                res = http_json(u)["result"]
                for i in ids:
                    r = res.get(i, {})
                    b["most_recent"].append({"pmid": i, "title": r.get("title"),
                                             "journal": r.get("fulljournalname") or r.get("source"),
                                             "year": (r.get("pubdate") or "")[:4] or None,
                                             "pubdate": r.get("pubdate"),
                                             "pubtypes": r.get("pubtype", [])})
        except (RuntimeError, NotFound) as e:
            b["error"] = str(e)
        print("  pubmed:", a, b.get("total"))
        return b

    agents = {a: agent_block(a) for a in AGENTS + ["ecopipam"]}
    yearly = {}
    for y in range(2010, 2027):
        try:
            yearly[str(y)], _ = search("%s AND %d[pdat]" % (ts, y))
        except (RuntimeError, NotFound) as e:
            yearly[str(y)] = {"error": str(e)}
    save("pubmed_evidence.json", {
        "fetched_at": now(),
        "source_urls": urls,
        "caveats": [
            "Counts are PubMed records matching the query, not a quality-weighted evidence grade. A "
            "record matching '<agent> AND Tourette Syndrome[MeSH]' may only mention the agent in passing "
            "(PubMed expands the agent name to MeSH, substance name and all-fields text).",
            "MeSH indexing lags publication by weeks to months, so the newest papers and the most "
            "recent years (and newer agents such as ecopipam) are undercounted.",
            "Publication-type filters depend on NLM indexing; some trials and reviews are not tagged.",
            "'most_recent' is PubMed's publication-date sort, newest first.",
            "The 2026 yearly count is a partial year as of fetched_at.",
            "Yearly counts use the [pdat] publication date field.",
        ],
        "tourette_mesh_records_by_year": yearly,
        "agents": agents,
    })


# --------------------------------------------------------------------- 7. SEC
def fetch_sec():
    u = "https://data.sec.gov/submissions/CIK0000818686.json"
    payload = {"fetched_at": now(), "source_urls": [u], "caveats": [
        "Requested with a generic User-Agent and no contact details. SEC's fair-access policy asks "
        "for a contact in the header and may refuse such requests at any time.",
        "primary_document_url is constructed from the accession number and primary document name "
        "following the standard EDGAR archive path; the URLs were not fetched or verified "
        "(www.sec.gov is outside the allowed hosts).",
        "The 40 most recent filings are dominated by insider-ownership forms (3, 4, 144). "
        "'recent_periodic_and_current_reports' therefore also lists the 20 most recent 10-K, 10-Q "
        "and 8-K filings found in the same API response (which holds roughly the latest 1,000 filings).",
    ]}
    try:
        d = http_json(u, tries=3)
        r = d["filings"]["recent"]
        cik = str(int(d["cik"]))
        filings = []
        for i in range(min(40, len(r["accessionNumber"]))):
            acc, doc = r["accessionNumber"][i], r["primaryDocument"][i]
            filings.append({
                "form": r["form"][i], "filing_date": r["filingDate"][i],
                "report_date": r["reportDate"][i] or None, "accession_number": acc,
                "primary_document": doc, "primary_doc_description": r["primaryDocDescription"][i] or None,
                "items": r["items"][i] or None,
                "primary_document_url": ("https://www.sec.gov/Archives/edgar/data/%s/%s/%s"
                                         % (cik, acc.replace("-", ""), doc)) if doc else None})
        key = [f for f in (
            {"form": r["form"][i], "filing_date": r["filingDate"][i],
             "report_date": r["reportDate"][i] or None, "accession_number": r["accessionNumber"][i],
             "primary_document": r["primaryDocument"][i], "items": r["items"][i] or None,
             "primary_document_url": "https://www.sec.gov/Archives/edgar/data/%s/%s/%s" % (
                 cik, r["accessionNumber"][i].replace("-", ""), r["primaryDocument"][i])}
            for i in range(len(r["accessionNumber"]))) if f["form"] in ("10-K", "10-Q", "8-K")][:20]
        payload["recent_periodic_and_current_reports"] = key
        payload.update({"company": d.get("name"), "cik": d.get("cik"), "tickers": d.get("tickers"),
                        "filing_count": len(filings),
                        "form_counts": dict(collections.Counter(f["form"] for f in filings)),
                        "filings": filings})
    except (RuntimeError, NotFound) as e:
        payload["error"] = "SEC request failed or was refused with the generic User-Agent: %s" % e
    save("sec_teva_filings.json", payload)


# ------------------------------------------------------------------- 8. NPPES
def fetch_nppes():
    base = "https://npiregistry.cms.hhs.gov/api/"
    specs = {
        "child_neurology": {"code": "2084N0402X",
                            "taxonomy_description": "Neurology with Special Qualifications in Child Neurology"},
        "child_adolescent_psychiatry": {"code": "2084P0804X",
                                        "taxonomy_description": "Child & Adolescent Psychiatry"},
    }
    out, errors = {}, []
    for key, sp in specs.items():
        states = {}
        for st in US_STATES:
            seen, capped, err = {}, False, None
            for skip in range(0, 1001, 200):
                u = base + "?" + urllib.parse.urlencode({
                    "version": "2.1", "enumeration_type": "NPI-1", "state": st,
                    "taxonomy_description": sp["taxonomy_description"], "limit": 200, "skip": skip})
                try:
                    d = http_json(u)
                except (RuntimeError, NotFound) as e:
                    err = str(e)
                    break
                if d.get("Errors"):
                    err = json.dumps(d["Errors"])
                    break
                res = d.get("results", [])
                for r in res:
                    tx = [t for t in r.get("taxonomies", []) if t.get("code") == sp["code"]]
                    loc = [a for a in r.get("addresses", []) if a.get("address_purpose") == "LOCATION"]
                    seen[r["number"]] = {
                        "has_code": bool(tx),
                        "primary": any(t.get("primary") for t in tx),
                        "practice_in_state": any(a.get("state") == st for a in loc),
                        "active": r.get("basic", {}).get("status") == "A"}
                if len(res) < 200:
                    break
                if skip == 1000:
                    capped = True
            v = list(seen.values())
            rec = {"capped": capped, "records_returned": len(v)}
            if err:
                rec["error"] = err
                errors.append({"specialty": key, "state": st, "error": err})
            elif capped:
                rec["note"] = ("API cap reached (1,200 records). True count is at least %d and unknown; "
                               "no count is reported." % len(v))
            else:
                rec.update({
                    "providers_with_taxonomy_code": sum(x["has_code"] for x in v),
                    "providers_practice_location_in_state": sum(x["has_code"] and x["practice_in_state"] for x in v),
                    "providers_primary_taxonomy_and_practice_in_state": sum(
                        x["has_code"] and x["primary"] and x["practice_in_state"] for x in v)})
            states[st] = rec
            print("  nppes:", key, st, rec.get("providers_practice_location_in_state"), "capped" if capped else "")
        out[key] = dict(sp, states=states,
                        capped_states=[s for s, r in states.items() if r["capped"]])
    save("nppes_specialists.json", {
        "fetched_at": now(),
        "source_urls": [base + "?version=2.1&enumeration_type=NPI-1&state=<ST>&taxonomy_description=<desc>"
                               "&limit=200&skip=<0..1000>"],
        "caveats": [
            "The NPI Registry API returns at most 1,200 records per query (limit 200, skip up to 1000). "
            "States that hit the cap are marked capped:true and carry NO count.",
            "The API has no taxonomy-code filter; queries use the taxonomy description and results are "
            "then filtered to providers that actually list the exact code.",
            "The API's state filter matches any address on the record (mailing or practice). "
            "'providers_practice_location_in_state' keeps only those whose practice LOCATION address is "
            "in the state and is the recommended figure; 'providers_with_taxonomy_code' is the wider count.",
            "A provider with addresses in two states can be counted in both.",
            "NPI taxonomy is self-reported and is not board certification. Records are rarely removed "
            "when clinicians retire or move, so counts overstate the active workforce. Trainees and "
            "clinicians who list the code as a secondary taxonomy are included unless the "
            "'primary_taxonomy' figure is used.",
            "Individual providers only (NPI-1). Includes DC and Puerto Rico.",
        ],
        "errors": errors,
        "specialties": out,
    })


SOURCES = [("ctgov", fetch_ctgov), ("labels", fetch_labels), ("shortages", fetch_shortages),
           ("faers", fetch_faers), ("pubmed", fetch_pubmed), ("sec", fetch_sec),
           ("sdud", fetch_sdud), ("nppes", fetch_nppes)]

if __name__ == "__main__":
    want = sys.argv[1:] or [n for n, _ in SOURCES]
    unknown = set(want) - {n for n, _ in SOURCES}
    if unknown:
        sys.exit("unknown source(s): %s" % ", ".join(sorted(unknown)))
    failed = []
    for name, fn in SOURCES:
        if name not in want:
            continue
        print("[%s] %s" % (now(), name))
        try:
            fn()
        except Exception as e:  # keep going; never fabricate
            failed.append(name)
            print("  FAILED: %r" % (e,))
            fname = {"ctgov": "ctgov_trials.json", "labels": "openfda_labels.json",
                     "shortages": "openfda_shortages.json", "faers": "openfda_faers.json",
                     "sdud": "medicaid_sdud.json", "pubmed": "pubmed_evidence.json",
                     "sec": "sec_teva_filings.json", "nppes": "nppes_specialists.json"}[name]
            save(fname, {"fetched_at": now(), "source_urls": [], "caveats": [],
                         "error": "Fetch failed: %r" % (e,)})
    print("[%s] done, %d requests, failed: %s" % (now(), REQUEST_COUNT, failed or "none"))
