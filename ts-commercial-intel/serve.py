#!/usr/bin/env python3
"""TS Commercial Intelligence — application server.

Python standard library only. One `dispatch(Req) -> Resp` router is shared by
both entry points, so the dev server and the production WSGI host run identical
request handling:

    python3 serve.py                      # threaded dev server on :8000
    passenger_wsgi.py -> application      # production (Passenger / mod_wsgi)

Security posture
----------------
* PBKDF2-SHA256, 200_000 iterations, 16-byte per-user salt.
* Constant-time hash comparison, with a dummy verification for unknown users so
  a wrong username and a wrong password cost the same wall-clock time.
* Opaque 32-byte session tokens in an HttpOnly / SameSite=Lax cookie, with both
  an idle timeout and an absolute lifetime.
* Brute-force lockout keyed on the *username* (the attacker-controlled IP is
  recorded for forensics but never used as the limiter key).
* X-Forwarded-* headers are ignored unless TRUST_PROXY=1, and even then only the
  last hop is honoured.
* Request paths are normalised before routing, so `//data/x.json` cannot slip
  past the `/data/` auth gate.
* A per-response CSP nonce is injected into index.html; no inline handlers.
* Static serving is allow-listed by extension and blocked by a deny-list, and
  every resolved path is confirmed to stay inside the app directory.
"""

import base64, binascii, hashlib, hmac, html, json, mimetypes, os, posixpath, re
import secrets, sqlite3, sys, threading, time
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("TSCI_DB", os.path.join(APP_DIR, "auth.db"))

# --- tunables -----------------------------------------------------------------
PBKDF2_ROUNDS      = 200_000
SESSION_IDLE_SEC   = 12 * 3600         # inactivity timeout
SESSION_ABS_SEC    = 7 * 24 * 3600     # hard lifetime regardless of activity
LOCKOUT_THRESHOLD  = 8                 # failures within the window
LOCKOUT_WINDOW_SEC = 15 * 60
LOCKOUT_COOLDOWN   = 15 * 60
MAX_BODY_BYTES     = 64 * 1024
TRUST_PROXY        = os.environ.get("TRUST_PROXY", "0") == "1"

# Only these extensions are ever served from disk.
ALLOWED_EXT = {".html", ".json", ".css", ".js", ".svg", ".png", ".jpg", ".jpeg",
               ".webp", ".ico", ".woff", ".woff2", ".txt"}
# Belt-and-braces: never serve these regardless of extension.
DENY_NAMES = {".env", ".env.example", "auth.db", "passenger_wsgi.py", "serve.py",
              "build_preview.py", "preview.html", ".gitignore"}
DENY_PARTS = {".git", "__pycache__", "node_modules", "deploy"}
DENY_SUFFIX = (".py", ".pyc", ".db", ".sqlite", ".sqlite3", ".log", ".md",
               ".db-wal", ".db-shm")

DATA_NAME_RE = re.compile(r"^[a-z0-9_]{1,64}$")
USERNAME_RE  = re.compile(r"^[A-Za-z0-9._-]{3,32}$")


# --- storage ------------------------------------------------------------------
_local = threading.local()

def db():
    conn = getattr(_local, "conn", None)
    if conn is None:
        conn = sqlite3.connect(DB_PATH, timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        _local.conn = conn
    return conn


def init_db():
    c = db()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS users(
      username TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      salt BLOB NOT NULL,
      pwhash BLOB NOT NULL,
      rounds INTEGER NOT NULL,
      created_at REAL NOT NULL,
      created_by TEXT);
    CREATE TABLE IF NOT EXISTS sessions(
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      created_at REAL NOT NULL,
      last_seen REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS login_fails(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT, ip TEXT, ts REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS events(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts REAL NOT NULL, username TEXT, kind TEXT NOT NULL,
      detail TEXT, ip TEXT);
    CREATE INDEX IF NOT EXISTS ix_fails_user_ts ON login_fails(username, ts);
    CREATE INDEX IF NOT EXISTS ix_sessions_user ON sessions(username);
    """)
    c.commit()


def log_event(username, kind, detail="", ip=""):
    c = db()
    c.execute("INSERT INTO events(ts,username,kind,detail,ip) VALUES(?,?,?,?,?)",
              (time.time(), username, kind, detail[:300], ip))
    c.execute("DELETE FROM events WHERE id NOT IN "
              "(SELECT id FROM events ORDER BY id DESC LIMIT 500)")
    c.commit()


# --- passwords ----------------------------------------------------------------
def hash_pw(password, salt, rounds=PBKDF2_ROUNDS):
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, rounds)


# Pre-computed so an unknown username still pays a full PBKDF2 verification.
_DUMMY_SALT = b"\x00" * 16
_DUMMY_HASH = hash_pw("dummy-password-for-timing-equalisation", _DUMMY_SALT)


def verify_pw(row, password):
    """Constant-time verification that costs the same for unknown users."""
    if row is None:
        hmac.compare_digest(hash_pw(password, _DUMMY_SALT), _DUMMY_HASH)
        return False
    calc = hash_pw(password, bytes(row["salt"]), int(row["rounds"]))
    return hmac.compare_digest(calc, bytes(row["pwhash"]))


def create_user(username, password, display_name, role="member", created_by=None):
    if not USERNAME_RE.match(username or ""):
        raise ValueError("Username must be 3-32 chars: letters, digits, . _ -")
    if not password or len(password) < 12:
        raise ValueError("Password must be at least 12 characters.")
    if role not in ("member", "admin"):
        raise ValueError("Invalid role.")
    salt = secrets.token_bytes(16)
    c = db()
    try:
        c.execute("INSERT INTO users(username,display_name,role,salt,pwhash,rounds,"
                  "created_at,created_by) VALUES(?,?,?,?,?,?,?,?)",
                  (username, (display_name or username)[:80], role, salt,
                   hash_pw(password, salt), PBKDF2_ROUNDS, time.time(), created_by))
        c.commit()
    except sqlite3.IntegrityError:
        raise ValueError("That username already exists.")


# --- lockout ------------------------------------------------------------------
def is_locked(username):
    """Locked when too many failures for this username inside the window."""
    now = time.time()
    row = db().execute(
        "SELECT COUNT(*) n, MAX(ts) last FROM login_fails "
        "WHERE username=? AND ts > ?",
        (username, now - LOCKOUT_WINDOW_SEC)).fetchone()
    if row and row["n"] >= LOCKOUT_THRESHOLD:
        return (row["last"] or 0) + LOCKOUT_COOLDOWN > now
    return False


def record_fail(username, ip):
    c = db()
    c.execute("INSERT INTO login_fails(username,ip,ts) VALUES(?,?,?)",
              (username, ip, time.time()))
    c.execute("DELETE FROM login_fails WHERE ts < ?",
              (time.time() - 30 * 24 * 3600,))
    c.commit()


def clear_fails(username):
    c = db()
    c.execute("DELETE FROM login_fails WHERE username=?", (username,))
    c.commit()


# --- sessions -----------------------------------------------------------------
def new_session(username):
    token = secrets.token_urlsafe(32)
    now = time.time()
    c = db()
    c.execute("INSERT INTO sessions(token,username,created_at,last_seen) "
              "VALUES(?,?,?,?)", (token, username, now, now))
    c.commit()
    return token


def session_user(token):
    if not token:
        return None
    now = time.time()
    c = db()
    row = c.execute(
        "SELECT s.token, s.created_at, s.last_seen, u.username, u.display_name, u.role "
        "FROM sessions s JOIN users u ON u.username = s.username WHERE s.token=?",
        (token,)).fetchone()
    if not row:
        return None
    if now - row["last_seen"] > SESSION_IDLE_SEC or now - row["created_at"] > SESSION_ABS_SEC:
        c.execute("DELETE FROM sessions WHERE token=?", (token,))
        c.commit()
        return None
    # Throttle writes: only refresh once a minute.
    if now - row["last_seen"] > 60:
        c.execute("UPDATE sessions SET last_seen=? WHERE token=?", (now, token))
        c.commit()
    return {"username": row["username"], "display_name": row["display_name"],
            "role": row["role"]}


def drop_session(token):
    if token:
        c = db()
        c.execute("DELETE FROM sessions WHERE token=?", (token,))
        c.commit()


def purge_expired():
    now = time.time()
    c = db()
    c.execute("DELETE FROM sessions WHERE ? - last_seen > ? OR ? - created_at > ?",
              (now, SESSION_IDLE_SEC, now, SESSION_ABS_SEC))
    c.commit()


# --- request / response -------------------------------------------------------
class Req:
    def __init__(self, method, path, headers, body, remote_addr, scheme="http"):
        self.method = method.upper()
        self.raw_path = path
        # Normalise before routing so `//data/x` and `/data/../x` cannot bypass gates.
        self.path = posixpath.normpath("/" + (path.split("?", 1)[0]).lstrip("/"))
        self.headers = {k.lower(): v for k, v in (headers or {}).items()}
        self.body = body or b""
        self._scheme = scheme
        self._remote = remote_addr or ""

    @property
    def ip(self):
        if TRUST_PROXY:
            fwd = self.headers.get("x-forwarded-for", "")
            if fwd:
                # Only the last hop is added by our own proxy; earlier entries
                # are attacker-controllable.
                return fwd.split(",")[-1].strip()[:64]
        return self._remote[:64]

    @property
    def secure(self):
        if TRUST_PROXY and self.headers.get("x-forwarded-proto", "").lower() == "https":
            return True
        return self._scheme == "https"

    @property
    def token(self):
        raw = self.headers.get("cookie", "")
        if not raw:
            return None
        try:
            ck = SimpleCookie()
            ck.load(raw)
        except Exception:
            return None
        m = ck.get("tsci_session")
        return m.value if m else None

    def json(self):
        if len(self.body) > MAX_BODY_BYTES:
            return None
        try:
            v = json.loads(self.body.decode("utf-8") or "{}")
            return v if isinstance(v, dict) else None
        except Exception:
            return None


class Resp:
    def __init__(self, status=200, body=b"", headers=None, content_type="text/plain; charset=utf-8"):
        self.status = status
        self.body = body if isinstance(body, bytes) else str(body).encode("utf-8")
        self.headers = headers or []
        if content_type:
            self.headers.append(("Content-Type", content_type))


def jresp(obj, status=200, headers=None):
    return Resp(status, json.dumps(obj).encode("utf-8"), headers or [],
                "application/json; charset=utf-8")


def security_headers(nonce, secure):
    csp = ("default-src 'self'; "
           "base-uri 'none'; "
           "object-src 'none'; "
           "frame-ancestors 'none'; "
           "form-action 'self'; "
           f"script-src 'nonce-{nonce}'; "
           "style-src 'self' 'unsafe-inline'; "
           "img-src 'self' data:; "
           "font-src 'self' data:; "
           "connect-src 'self'")
    h = [("Content-Security-Policy", csp),
         ("X-Content-Type-Options", "nosniff"),
         ("Referrer-Policy", "no-referrer"),
         ("X-Frame-Options", "DENY"),
         ("Permissions-Policy", "geolocation=(), microphone=(), camera=(), interest-cohort=()"),
         ("Cache-Control", "no-store")]
    if secure:
        h.append(("Strict-Transport-Security", "max-age=31536000; includeSubDomains"))
    return h


def cookie_header(token, secure, clear=False):
    parts = [f"tsci_session={'' if clear else token}", "Path=/", "HttpOnly", "SameSite=Lax"]
    if secure:
        parts.append("Secure")
    parts.append("Max-Age=0" if clear else f"Max-Age={SESSION_ABS_SEC}")
    return ("Set-Cookie", "; ".join(parts))


# --- static -------------------------------------------------------------------
def safe_static_path(rel):
    """Resolve `rel` inside APP_DIR, or return None if it is not serveable."""
    rel = rel.lstrip("/")
    if not rel:
        rel = "index.html"
    parts = rel.split("/")
    if any(p in DENY_PARTS for p in parts):
        return None
    name = parts[-1]
    if name in DENY_NAMES or name.startswith("."):
        return None
    low = name.lower()
    if low.endswith(DENY_SUFFIX):
        return None
    ext = os.path.splitext(low)[1]
    if ext not in ALLOWED_EXT:
        return None
    full = os.path.realpath(os.path.join(APP_DIR, rel))
    root = os.path.realpath(APP_DIR)
    if full != root and not full.startswith(root + os.sep):
        return None
    if not os.path.isfile(full):
        return None
    return full


def serve_index(nonce, secure):
    try:
        with open(os.path.join(APP_DIR, "index.html"), encoding="utf-8") as f:
            page = f.read()
    except OSError:
        return Resp(500, b"index.html missing")
    page = page.replace("__CSP_NONCE__", nonce)
    return Resp(200, page.encode("utf-8"),
                security_headers(nonce, secure), "text/html; charset=utf-8")


# --- router -------------------------------------------------------------------
def dispatch(req):
    nonce = base64.b64encode(secrets.token_bytes(16)).decode("ascii")
    sec = security_headers(nonce, req.secure)
    user = session_user(req.token)
    p, m = req.path, req.method

    # ---- auth API ----
    if p == "/api/me":
        return jresp({"authenticated": bool(user), "user": user}, headers=sec)

    if p == "/api/login" and m == "POST":
        data = req.json() or {}
        username = str(data.get("username", "")).strip()[:64]
        password = str(data.get("password", ""))[:512]
        if not username or not password:
            return jresp({"error": "Enter a username and password."}, 400, sec)
        if is_locked(username):
            log_event(username, "login_locked", "", req.ip)
            return jresp({"error": "Too many attempts. Try again in 15 minutes."}, 429, sec)
        row = db().execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        if not verify_pw(row, password):
            record_fail(username, req.ip)
            log_event(username, "login_failed", "", req.ip)
            return jresp({"error": "Invalid username or password."}, 401, sec)
        clear_fails(username)
        token = new_session(username)
        log_event(username, "login", "", req.ip)
        me = {"username": row["username"], "display_name": row["display_name"],
              "role": row["role"]}
        return jresp({"ok": True, "user": me}, 200,
                     sec + [cookie_header(token, req.secure)])

    if p == "/api/logout" and m == "POST":
        if user:
            log_event(user["username"], "logout", "", req.ip)
        drop_session(req.token)
        return jresp({"ok": True}, 200, sec + [cookie_header("", req.secure, clear=True)])

    # ---- everything below requires a session ----
    if p.startswith("/api/admin/"):
        if not user:
            return jresp({"error": "Not signed in."}, 401, sec)
        if user["role"] != "admin":
            return jresp({"error": "Admin only."}, 403, sec)

        if p == "/api/admin/genpw" and m == "POST":
            alpha = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
            return jresp({"password": "".join(secrets.choice(alpha) for _ in range(20))},
                         headers=sec)

        if p == "/api/admin/users" and m == "GET":
            rows = db().execute(
                "SELECT username,display_name,role,created_by FROM users "
                "ORDER BY created_at").fetchall()
            return jresp({"users": [dict(r) for r in rows]}, headers=sec)

        if p == "/api/admin/users" and m == "POST":
            d = req.json() or {}
            try:
                create_user(str(d.get("username", "")).strip(),
                            str(d.get("password", "")),
                            str(d.get("display_name", "")).strip(),
                            str(d.get("role", "member")),
                            created_by=user["username"])
            except ValueError as e:
                return jresp({"error": str(e)}, 400, sec)
            log_event(user["username"], "user_created",
                      str(d.get("username", ""))[:64], req.ip)
            return jresp({"ok": True}, headers=sec)

        if p == "/api/admin/events" and m == "GET":
            rows = db().execute(
                "SELECT ts,username,kind,detail,ip FROM events "
                "ORDER BY id DESC LIMIT 200").fetchall()
            return jresp({"events": [dict(r) for r in rows]}, headers=sec)

        if p == "/api/admin/login-fails" and m == "GET":
            rows = db().execute(
                "SELECT ts,username,ip FROM login_fails "
                "ORDER BY id DESC LIMIT 200").fetchall()
            return jresp({"fails": [dict(r) for r in rows]}, headers=sec)

        return jresp({"error": "Not found."}, 404, sec)

    if p.startswith("/api/"):
        return jresp({"error": "Not found."}, 404, sec)

    # ---- gated content ----
    if p.startswith("/data/"):
        if not user:
            return jresp({"error": "Not signed in."}, 401, sec)
        name = p[len("/data/"):]
        if not name.endswith(".json"):
            return jresp({"error": "Not found."}, 404, sec)
        stem = name[:-5]
        if not DATA_NAME_RE.match(stem):
            return jresp({"error": "Not found."}, 404, sec)
        full = os.path.join(APP_DIR, "data", stem + ".json")
        real = os.path.realpath(full)
        root = os.path.realpath(os.path.join(APP_DIR, "data"))
        if not real.startswith(root + os.sep) or not os.path.isfile(real):
            return jresp({"error": "Not found."}, 404, sec)
        with open(real, "rb") as f:
            return Resp(200, f.read(), sec, "application/json; charset=utf-8")

    # ---- app shell + static ----
    if m not in ("GET", "HEAD"):
        return Resp(405, b"Method not allowed", sec)

    if p == "/" or p == "/index.html":
        return serve_index(nonce, req.secure)

    full = safe_static_path(p)
    if full:
        ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
        with open(full, "rb") as f:
            return Resp(200, f.read(), sec, ctype + "; charset=utf-8"
                        if ctype.startswith("text/") else ctype)

    # A path that looks like a file request but is not serveable is a 404 —
    # only extension-less routes fall through to the client-side router.
    segs = [x for x in p.split("/") if x]
    base = segs[-1] if segs else ""
    looks_like_asset = (
        os.path.splitext(base)[1]                       # has a file extension
        or any(x.startswith(".") for x in segs)         # dotfile / dot-directory
        or any(x in DENY_PARTS for x in segs)           # .git, deploy, __pycache__
    )
    if looks_like_asset:
        return Resp(404, b"Not found", sec)

    # Unknown route: hand back the shell so client-side hash routing works.
    return serve_index(nonce, req.secure)


# --- WSGI entry point ---------------------------------------------------------
def application(environ, start_response):
    init_db()
    try:
        length = int(environ.get("CONTENT_LENGTH") or 0)
    except ValueError:
        length = 0
    length = max(0, min(length, MAX_BODY_BYTES))
    body = environ["wsgi.input"].read(length) if length else b""

    headers = {}
    for k, v in environ.items():
        if k.startswith("HTTP_"):
            headers[k[5:].replace("_", "-").lower()] = v
    if environ.get("CONTENT_TYPE"):
        headers["content-type"] = environ["CONTENT_TYPE"]

    req = Req(environ.get("REQUEST_METHOD", "GET"),
              environ.get("PATH_INFO", "/"),
              headers, body,
              environ.get("REMOTE_ADDR", ""),
              environ.get("wsgi.url_scheme", "http"))
    resp = dispatch(req)
    start_response(f"{resp.status} ", resp.headers + [("Content-Length", str(len(resp.body)))])
    return [resp.body]


# --- dev server ---------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    server_version = "tsci"
    sys_version = ""

    def _run(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        length = max(0, min(length, MAX_BODY_BYTES))
        body = self.rfile.read(length) if length else b""
        req = Req(self.command, self.path, dict(self.headers), body,
                  self.client_address[0], "http")
        try:
            resp = dispatch(req)
        except Exception as e:                     # never leak a traceback
            sys.stderr.write(f"error: {e!r}\n")
            resp = jresp({"error": "Server error."}, 500)
        self.send_response(resp.status)
        for k, v in resp.headers:
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(resp.body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(resp.body)

    do_GET = do_POST = do_HEAD = _run

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


def main():
    init_db()
    purge_expired()
    if len(sys.argv) > 1 and sys.argv[1] == "adduser":
        if len(sys.argv) < 5:
            print("usage: serve.py adduser <username> <display name> <role> [password]")
            return 2
        username, display, role = sys.argv[2], sys.argv[3], sys.argv[4]
        pw = sys.argv[5] if len(sys.argv) > 5 else secrets.token_urlsafe(15)
        create_user(username, pw, display, role)
        print(f"created {username} ({role})\npassword: {pw}")
        return 0
    port = int(os.environ.get("PORT", "8000"))
    if not db().execute("SELECT COUNT(*) n FROM users").fetchone()["n"]:
        print("No users yet. Create the first admin:\n"
              "  python3 serve.py adduser <username> \"<Display Name>\" admin")
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"TS Commercial Intelligence -> http://127.0.0.1:{port}  "
          f"(TRUST_PROXY={'on' if TRUST_PROXY else 'off'})")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
