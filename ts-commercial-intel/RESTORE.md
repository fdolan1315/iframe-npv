# Restore notes

## What happened

The application was developed in an ephemeral cloud container and committed to a
**local-only** git repository. A dedicated GitHub repository could not be created
(the integration returns `403 Resource not accessible by integration` for
repository creation), so the work was never pushed to a remote. When the
container was reclaimed and rebuilt, that local repository was lost.

This directory exists inside `fdolan1315/iframe-npv` — a repository the
integration *can* write to — so the work is durable from here on.

## Recovery source

The `preview.html` build is a complete, self-contained snapshot of the front end:
`build_preview.py` inlined the full `index.html` (all CSS, all JavaScript, every
render function) together with all 14 `data/*.json` files, and disabled auth.

Re-uploading the most recent `preview.html` allows the front end and the entire
`data/` tree to be reconstructed from it.

## Restored from the preview build

- `index.html` — complete front end.
- `data/*.json` — all datasets, including the geocoded provider/map dataset and
  the Census-derived state child-population tables.

## Rewritten, not restored

These are not present in the preview build and must be re-implemented:

- `serve.py` — including the security hardening: PBKDF2-SHA256 (200k iterations,
  per-user salt), constant-time comparison with a dummy-hash timing equalizer,
  session idle + absolute expiry, per-username brute-force lockout with a
  `TRUST_PROXY` flag (default off) gating any trust of forwarded headers,
  request-path normalization (closing the `//data/...` auth bypass), a
  per-response CSP nonce, a secret/artifact deny-list, and admin-only user
  creation.
- `passenger_wsgi.py`, `build_preview.py`
- `SCHEMA.md`, `FACT-CHECK.md`, deployment notes, `.env.example`, `.gitignore`

Because the server is new code rather than restored code, it warrants a fresh
security review before deployment.
