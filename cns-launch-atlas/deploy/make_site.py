"""Package the app for a cPanel-style host behind the personal-link gate.

Usage:  python3 make_site.py [admin name] [number of spare codes]
Output: deploy/out/atlas-site.zip  (git-ignored: it contains live access codes)

Upload the zip into the subdomain's folder in File Manager and extract it there. Layout after extracting:
  index.php            the gate (checks the personal link, logs the visit, then serves the app)
  .htaccess            no directory listings, no indexing, data files blocked
  robots.txt           tells search engines to stay out
  app/atlas.html       the app itself; cannot be opened directly
  access/people.csv    one row per person: code, name, role, active
  access/log.csv       written by the gate on first visit
  media/               photos and the two explainer films (illustrative only; not gated)
"""
import io, os, secrets, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"   # no look-alike characters


def code(n=20):
    return "".join(secrets.choice(ALPHABET) for _ in range(n))


DENY = """<IfModule mod_authz_core.c>
Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
Order deny,allow
Deny from all
</IfModule>
"""
HTACCESS = """Options -Indexes
DirectoryIndex index.php
<IfModule mod_headers.c>
Header set X-Robots-Tag "noindex, nofollow, noarchive"
</IfModule>
<FilesMatch "\\.(csv|log|txt|md|py)$">
  <IfModule mod_authz_core.c>
  Require all denied
  </IfModule>
  <IfModule !mod_authz_core.c>
  Order deny,allow
  Deny from all
  </IfModule>
</FilesMatch>
<Files "robots.txt">
  <IfModule mod_authz_core.c>
  Require all granted
  </IfModule>
  <IfModule !mod_authz_core.c>
  Order allow,deny
  Allow from all
  </IfModule>
</Files>
"""


def main():
    admin = sys.argv[1] if len(sys.argv) > 1 else "Owner"
    spare = int(sys.argv[2]) if len(sys.argv) > 2 else 40
    os.makedirs(OUT, exist_ok=True)
    admin_code = code(24)
    rows = ["code,name,role,active", f"{admin_code},{admin},admin,yes"] + [f"{code()},,,yes" for _ in range(spare)]
    z = zipfile.ZipFile(os.path.join(OUT, "atlas-site.zip"), "w", zipfile.ZIP_DEFLATED)

    def text(name, body):   # files must be readable by the web server after extraction (0644), folders 0755
        zi = zipfile.ZipInfo(name); zi.external_attr = 0o644 << 16; zi.compress_type = zipfile.ZIP_DEFLATED; z.writestr(zi, body)
    for d in ("app/", "access/", "media/"):
        zi = zipfile.ZipInfo(d); zi.external_attr = (0o755 << 16) | 0x10; z.writestr(zi, "")
    text("index.php", open(os.path.join(HERE, "gate", "index.php")).read())
    text(".htaccess", HTACCESS)
    text("robots.txt", "User-agent: *\nDisallow: /\n")
    text("app/atlas.html", open(os.path.join(ROOT, "dist", "index.html"), encoding="utf8").read())
    text("app/.htaccess", DENY)
    text("access/people.csv", "\n".join(rows) + "\n")
    text("access/.htaccess", DENY)
    media = os.path.join(ROOT, "dist", "media")
    for f in sorted(os.listdir(media)):
        if f.endswith(".json"):
            continue
        zi = zipfile.ZipInfo("media/" + f); zi.external_attr = 0o644 << 16; zi.compress_type = zipfile.ZIP_STORED
        z.writestr(zi, open(os.path.join(media, f), "rb").read())
    z.close()
    size = os.path.getsize(os.path.join(OUT, "atlas-site.zip")) / 1e6
    print(f"wrote {os.path.join(OUT, 'atlas-site.zip')} ({size:.1f} MB); {spare} spare codes; admin: {admin}")
    print("admin link ends with:  /?k=" + admin_code)


if __name__ == "__main__":
    main()
