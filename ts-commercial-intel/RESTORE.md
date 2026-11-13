# Restore record

**Status: restored and verified.** This file documents what was lost, what was
recovered, and how the recovery was proven correct.

## What happened

The application was developed in an ephemeral cloud container and committed to a
**local-only** git repository. A dedicated GitHub repository could not be created
(the integration returns `403 Resource not accessible by integration` for
repository creation), so the work was never pushed to a remote. When the
container was reclaimed and rebuilt, that local history was lost.

The project now lives inside `fdolan1315/iframe-npv` — a repository the
integration can write to — so it is durable from here on.

## Recovery source

`preview.html`, the self-contained build produced by `build_preview.py`. That
build inlines the complete `index.html` (all CSS, all JavaScript, every render
function) together with all 14 `data/*.json` files, and stubs out auth. It is
therefore a faithful snapshot of the entire front end.

## What was restored, and how it was verified

Restored directly from the preview build:

- `index.html` — the complete front end, with the three preview-only patches
  reverted (`getData` back to `fetch('/data/...')`, `boot` back to the
  `/api/me` session check, and the page title).
- `data/*.json` — all 14 datasets, including `geo_map.json` (766 geocoded
  providers, 49 states, 22 Centers of Excellence, 106 metros) and the
  Census-derived state child-population figures.

**Verification:** re-running `build_preview.py` against the restored tree
reproduces a `preview.html` that is **byte-identical** to the recovered file.
That round-trip proves the front end and every dataset were restored exactly.

The app was then served through the rewritten `serve.py` and driven end to end in
a browser: sign-in, all ten views plus Admin, and the map's click-to-filter,
sort and reset behaviour — with no console errors.

## What was rewritten rather than restored

The server is **not** present in the preview build and was written fresh:

- `serve.py` — PBKDF2-SHA256 (200k rounds, 16-byte per-user salt), constant-time
  comparison with a dummy-hash timing equaliser, opaque session tokens with idle
  and absolute expiry, per-username brute-force lockout, `TRUST_PROXY` (default
  off) gating any trust of forwarded headers, path normalisation closing the
  `//data/...` gate bypass, a per-response CSP nonce, allow-listed static serving
  with a deny-list and realpath containment, and admin-only user creation.
- `passenger_wsgi.py`, `build_preview.py`, `.env.example`

`SCHEMA.md` and the deployment walkthrough were not recovered and are not
reconstructed here; the data shapes are self-describing in `data/*.json`.

## First run

```bash
python3 serve.py adduser <username> "<Display Name>" admin
python3 serve.py            # http://127.0.0.1:8000
```

Set `TRUST_PROXY=1` **only** behind a reverse proxy that overwrites
`X-Forwarded-For` rather than appending to a client-supplied value.
