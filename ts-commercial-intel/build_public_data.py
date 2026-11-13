#!/usr/bin/env python3
"""Condense data_raw/ (public API pulls) into the compact files the app loads.

Reads   data_raw/*.json  (written by data_raw/fetch_public_data.py)
Writes  data/public_data.json
Updates data/geo_map.json state metrics (open trials, specialists)

No dollar amounts are read or written. Run after refreshing data_raw/:
    python3 data_raw/fetch_public_data.py && python3 build_public_data.py
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "data_raw")
DATA = os.path.join(HERE, "data")

STATE_CODES = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "District of Columbia": "DC",
    "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL",
    "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA",
    "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN",
    "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
    "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR",
    "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
    "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA",
    "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
}
OPEN = {"RECRUITING", "NOT_YET_RECRUITING", "ACTIVE_NOT_RECRUITING", "ENROLLING_BY_INVITATION"}


def load(name):
    path = os.path.join(RAW, name + ".json")
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def first(v):
    return v[0] if isinstance(v, list) and v else v


def iso_date(yyyymmdd):
    s = str(yyyymmdd or "")
    return "%s-%s-%s" % (s[:4], s[4:6], s[6:8]) if re.fullmatch(r"\d{8}", s) else None


def clean(text, limit):
    t = re.sub(r"\s+", " ", str(text or "")).strip()
    return t if len(t) <= limit else t[:limit].rsplit(" ", 1)[0] + "…"


def build_agents():
    labels = (load("openfda_labels") or {}).get("agents", {})
    shortages = (load("openfda_shortages") or {}).get("agents", {})
    faers = (load("openfda_faers") or {}).get("agents", {})
    pubmed = (load("pubmed_evidence") or {}).get("agents", {})
    medicaid = build_medicaid()
    out = {}
    for name in sorted(set(labels) | set(pubmed)):
        a = {}
        lab = (labels.get(name) or {}).get("label")
        if lab:
            bw = lab.get("boxed_warning")
            a["label"] = {
                "product": first(lab.get("brand_name")),
                "manufacturer": first(lab.get("manufacturer")),
                "is_reference_brand": str(lab.get("selection", "")).startswith("reference brand"),
                "effective": iso_date(lab.get("effective_time")),
                "set_id": lab.get("set_id"),
                "tourette_indication": bool(lab.get("mentions_tourette")),
                "boxed_warning": bool(lab.get("has_boxed_warning")),
                "boxed_warning_text": clean(bw, 420) if bw else None,
            }
            dfa = (labels[name].get("drugsfda") or {}).get("single_ingredient_not_discontinued") or {}
            a["approved_applications"] = dfa.get("applications")
            a["approved_sponsors"] = dfa.get("sponsors")
        sh = shortages.get(name)
        if sh is not None:
            a["supply"] = {
                "records": sh.get("record_count", 0),
                "status_counts": sh.get("status_counts", {}),
                "items": [{
                    "presentation": clean(r.get("presentation"), 120),
                    "status": r.get("status"),
                    "company": r.get("company_name"),
                    "updated": r.get("update_date"),
                    "reason": clean(r.get("shortage_reason") or r.get("related_info"), 140),
                } for r in sh.get("records", [])[:8]],
            }
        fa = faers.get(name)
        if fa:
            a["faers"] = {}
            for key in ("all_ages", "under_18"):
                blk = fa.get(key) or {}
                if blk.get("total_reports") is not None:
                    a["faers"][key] = {
                        "total": blk["total_reports"],
                        "top": [{"term": r["term"].capitalize(), "n": r["reports"]}
                                for r in (blk.get("top_reactions") or [])[:10]],
                    }
        pm = pubmed.get(name)
        if pm:
            a["pubmed"] = {
                "total": pm.get("total"),
                "rct": pm.get("randomized_controlled_trials"),
                "reviews": pm.get("meta_analyses_or_systematic_reviews"),
                "recent": [{"pmid": r.get("pmid"), "title": clean(r.get("title"), 160),
                            "journal": r.get("journal"), "year": r.get("year")}
                           for r in (pm.get("most_recent") or [])[:4]],
            }
        if medicaid and name in medicaid["agents"]:
            a["medicaid"] = medicaid["agents"][name]
        out[name] = a
    return out, medicaid


def build_medicaid():
    """Tolerant reader: the Medicaid pull is optional and its exact shape is
    validated here rather than assumed. Returns None when absent or unusable."""
    raw = load("medicaid_sdud")
    if not raw or raw.get("error"):
        return None
    rows = raw.get("rows") or raw.get("state_rows") or raw.get("data")
    if not isinstance(rows, list) or not rows:
        return None
    agents = {}
    for r in rows:
        try:
            name, st, yr = r["agent"], r["state"], int(r["year"])
            rx = float(r.get("number_of_prescriptions") or r.get("prescriptions") or 0)
        except (KeyError, TypeError, ValueError):
            return None
        if st in ("XX", "US"):
            continue
        a = agents.setdefault(name, {"by_year": {}, "by_state": {}})
        a["by_year"][yr] = a["by_year"].get(yr, 0) + rx
        a["by_state"].setdefault(yr, {})
        a["by_state"][yr][st] = a["by_state"][yr].get(st, 0) + rx
    out = {}
    for name, a in agents.items():
        years = sorted(a["by_year"])
        # a year counts as complete only if it carries all four quarters
        quarters = {}
        for r in rows:
            if r.get("agent") == name and r.get("state") not in ("XX", "US"):
                quarters.setdefault(int(r["year"]), set()).add(int(r.get("quarter") or 0))
        full = [y for y in years if len(quarters.get(y, ())) >= 4]
        latest = full[-1] if full else None
        out[name] = {
            "by_year": [{"year": y, "rx": round(a["by_year"][y]), "complete": y in full} for y in years],
            "latest_full_year": latest,
            "by_state": ({s: round(v) for s, v in sorted(a["by_state"][latest].items())} if latest else {}),
        }
    # share of NDC-level rows CMS suppressed (<11 prescriptions) and so excluded
    for name, o in out.items():
        tot = sup = 0
        for r in raw.get("suppression_summary_state_rows") or []:
            if r.get("agent") == name and int(r.get("year") or 0) == o["latest_full_year"]:
                tot += r.get("ndc_rows") or 0
                sup += r.get("suppressed_rows_excluded") or 0
        o["suppressed_share"] = round(sup / tot, 2) if tot else None
    return {"agents": out, "fetched_at": raw.get("fetched_at")}


def build_trials():
    raw = load("ctgov_trials")
    if not raw:
        return None
    open_studies, by_state = [], {}
    for s in raw["studies"]:
        if s.get("overallStatus") not in OPEN:
            continue
        # the registry's term matching pulls in unrelated studies; keep only
        # those that actually list Tourette or a tic disorder as a condition
        if not any(re.search(r"tourette|\btics?\b", c, re.I) for c in s.get("conditions") or []):
            continue
        states = sorted({STATE_CODES[l["state"]] for l in s.get("locations") or []
                         if l.get("country") == "United States" and l.get("state") in STATE_CODES})
        for st in states:
            by_state[st] = by_state.get(st, 0) + 1
        kinds = sorted({(i.get("type") or "OTHER").upper() for i in s.get("interventions") or []})
        open_studies.append({
            "nct": s["nctId"],
            "title": clean(s.get("briefTitle"), 150),
            "status": s["overallStatus"],
            "phase": "/".join(p.replace("PHASE", "Phase ").replace("EARLY_", "Early ").replace("NA", "N/A")
                              for p in (s.get("phases") or [])) or "—",
            "type": s.get("studyType"),
            "sponsor": (s.get("leadSponsor") or {}).get("name"),
            "sponsor_class": (s.get("leadSponsor") or {}).get("class"),
            "interventions": [clean(i.get("name"), 60) for i in (s.get("interventions") or [])[:3]],
            "kinds": kinds,
            "enrollment": s.get("enrollmentCount"),
            "primary_completion": s.get("primaryCompletionDate"),
            "updated": s.get("lastUpdatePostDate"),
            "us_states": states,
            "countries": len({l.get("country") for l in s.get("locations") or [] if l.get("country")}),
        })
    open_studies.sort(key=lambda t: (t["primary_completion"] or "9999", t["nct"]))
    return {
        "fetched_at": raw["fetched_at"],
        "total_registered": raw["study_count"],
        "by_status": raw["summary"]["by_status"],
        "open_count": len(open_studies),
        "open": open_studies,
        "open_studies_by_state": by_state,
    }


def build_specialists():
    raw = load("nppes_specialists")
    if not raw:
        return None
    out = {}
    for key, spec in raw["specialties"].items():
        states = {}
        for st, v in spec["states"].items():
            states[st] = None if v.get("capped") else v.get("providers_practice_location_in_state")
        out[key] = {"label": spec["taxonomy_description"], "code": spec["code"],
                    "by_state": states, "capped": spec.get("capped_states", [])}
    return {"fetched_at": raw["fetched_at"], "specialties": out}


# SEC Form 8-K item numbers -> plain descriptions (SEC's own item titles, shortened)
ITEMS_8K = {
    "1.01": "Material agreement", "1.02": "Agreement terminated", "2.01": "Acquisition or disposal completed",
    "2.02": "Quarterly results", "2.03": "New financial obligation", "2.05": "Restructuring costs",
    "2.06": "Impairment", "3.03": "Change to security holders' rights", "5.02": "Director or officer change",
    "5.03": "Charter or bylaw change", "5.07": "Shareholder vote results", "7.01": "Investor disclosure (Reg FD)",
    "8.01": "Other event",
}
PERIODIC = {"10-K": "Annual report", "10-Q": "Quarterly report"}


def sec_what(f):
    if f["form"] in PERIODIC:
        return PERIODIC[f["form"]]
    items = [i.strip() for i in str(f.get("items") or "").split(",") if i.strip() and i.strip() != "9.01"]
    return "; ".join(ITEMS_8K.get(i, "Item " + i) for i in items) or "Current report"


def main():
    agents, medicaid = build_agents()
    trials = build_trials()
    specialists = build_specialists()
    pubmed = load("pubmed_evidence") or {}
    sec = load("sec_teva_filings") or {}
    faers = load("openfda_faers") or {}
    out = {
        "_comment": "Generated by build_public_data.py from data_raw/. Do not edit by hand.",
        "fetched": {
            "labels": (load("openfda_labels") or {}).get("fetched_at"),
            "supply": (load("openfda_shortages") or {}).get("fetched_at"),
            "faers": faers.get("fetched_at"),
            "faers_data_through": faers.get("openfda_last_updated"),
            "pubmed": pubmed.get("fetched_at"),
            "trials": trials and trials["fetched_at"],
            "specialists": specialists and specialists["fetched_at"],
            "medicaid": medicaid and medicaid["fetched_at"],
        },
        "agents": agents,
        "trials": trials,
        "specialists": specialists,
        "pubmed_by_year": [{"year": int(y), "n": n} for y, n in
                           sorted((pubmed.get("tourette_mesh_records_by_year") or {}).items())],
        "sec": {
            "company": sec.get("company"), "cik": sec.get("cik"), "fetched_at": sec.get("fetched_at"),
            "reports": [{"form": f["form"], "date": f["filing_date"], "period": f.get("report_date"),
                         "what": sec_what(f), "url": f["primary_document_url"]}
                        for f in (sec.get("recent_periodic_and_current_reports") or [])[:16]],
        },
        "has_medicaid": bool(medicaid),
    }
    with open(os.path.join(DATA, "public_data.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")

    # state metrics for the map
    gpath = os.path.join(DATA, "geo_map.json")
    with open(gpath, encoding="utf-8") as fh:
        geo = json.load(fh)
    cn = specialists["specialties"]["child_neurology"]["by_state"] if specialists else {}
    cap = specialists["specialties"]["child_adolescent_psychiatry"]["by_state"] if specialists else {}
    for st in geo["states"]:
        code = st["code"]
        st["open_trials"] = (trials["open_studies_by_state"].get(code, 0) if trials else None)
        st["child_neuro"] = cn.get(code)
        st["child_psych"] = cap.get(code)
        kids = st.get("child_u18")
        st["neuro_per_100k"] = (round(cn[code] / kids * 100000, 1)
                                if kids and cn.get(code) is not None else None)
    with open(gpath, "w", encoding="utf-8") as fh:
        json.dump(geo, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print("public_data.json: %d agents, %s open trials, medicaid=%s" %
          (len(agents), trials and trials["open_count"], bool(medicaid)))


if __name__ == "__main__":
    main()
