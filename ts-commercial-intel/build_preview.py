#!/usr/bin/env python3
"""Build a single self-contained preview.html.

Inlines every data/*.json into index.html and stubs out authentication, so the
whole app can be opened directly from disk (file://) with no server.

    python3 build_preview.py

The output is a faithful snapshot of the front end: because every dataset is
embedded, preview.html doubles as a portable backup of the client and its data.
Keep it out of version control (see .gitignore) — it is a build artifact.
"""

import glob
import json
import os

APP_DIR = os.path.dirname(os.path.abspath(__file__))

SRC_GETDATA = """async function getData(name){
  if(S.cache[name]) return S.cache[name];
  const r = await fetch('/data/'+name+'.json', {cache:'no-store'});
  if(r.status===401){ sessionExpired(); throw new Error('session expired'); }
  if(!r.ok) throw new Error('load '+name);
  const j = await r.json(); S.cache[name]=j; return j;
}"""
PREVIEW_GETDATA = """async function getData(name){
  if(!window.EMBED || window.EMBED[name]===undefined) throw new Error('load '+name);
  return window.EMBED[name];
}"""

SRC_BOOT = """async function boot(){
  const me = await api('/api/me');
  if(me.data && me.data.authenticated){ S.me = me.data.user; await showApp(); }
  else showLogin();
}"""
PREVIEW_BOOT = """async function boot(){
  S.me = {username:'preview', display_name:'Local preview', role:'member'};
  await showApp();
}"""


def main():
    with open(os.path.join(APP_DIR, "index.html"), encoding="utf-8") as f:
        html = f.read()

    payload = {}
    for path in sorted(glob.glob(os.path.join(APP_DIR, "data", "*.json"))):
        name = os.path.splitext(os.path.basename(path))[0]
        with open(path, encoding="utf-8") as f:
            payload[name] = json.load(f)

    for old, new in ((SRC_GETDATA, PREVIEW_GETDATA), (SRC_BOOT, PREVIEW_BOOT)):
        if html.count(old) != 1:
            raise SystemExit("build_preview: could not patch index.html "
                             "(source block changed?)")
        html = html.replace(old, new)


    import base64
    for rel, mime in (("assets/bios-logo-primary.svg", "image/svg+xml"),
                      ("assets/bios-logo-reverse-transparent.svg", "image/svg+xml"),
                      ("assets/fonts/inter-latin-wght-normal.woff2", "font/woff2"),
                      ("assets/fonts/instrument-sans-latin-wght-normal.woff2", "font/woff2")):
        with open(os.path.join(APP_DIR, rel), "rb") as f:
            html = html.replace(rel, "data:%s;base64,%s" % (mime, base64.b64encode(f.read()).decode("ascii")))

    blob = "<script>window.EMBED=" + json.dumps(payload) + ";</script>"
    marker = '<script nonce="__CSP_NONCE__">'
    if marker in html:
        html = html.replace(marker, blob + "\n" + marker, 1)
    else:
        html = html.replace("<script>", blob + "\n<script>", 1)

    out = os.path.join(APP_DIR, "preview.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    print("preview.html written: %d bytes; %d data files embedded"
          % (os.path.getsize(out), len(payload)))


if __name__ == "__main__":
    main()
