"""Generate the documentary-style stills used in the app (Higgsfield API, Soul text-to-image).

Usage: python3 stills.py [name ...]   # no names = all that are missing
Each prompt asks for hands and settings only: no faces, no text, no medicines. Outputs go to stills/<name>.png.
"""
import os, sys, urllib.request
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env.local"))
if not os.getenv("HF_KEY"):
    sys.exit("HF_KEY is not set. Copy .env.local.example to .env.local.")
import higgsfield_client  # noqa: E402

STYLE = ("Documentary photograph, natural window light, shallow depth of field, cool muted palette of slate blue, steel grey and soft white, "
         "calm and dignified, realistic skin and materials, no face visible, no text or lettering anywhere, no logos, no medicines or pills, 35mm lens.")
PROMPTS = {
    "et-cup": "Close-up of an older adult's two hands steadying a plain white ceramic cup on a wooden kitchen table.",
    "et-pen": "Close-up of an older adult's hand holding a pen above a blank sheet of paper on a desk, about to write.",
    "et-table": "A kitchen table set for one with a cup that has a lid and thick-handled cutlery, an older adult's hand resting beside the plate.",
    "dee-hand": "Close-up of a parent's hand gently holding an infant's tiny hand on a soft knitted blanket.",
    "dee-corridor": "An empty, quiet hospital corridor at night with a row of chairs and soft cool light from a doorway, no people.",
    "dee-counter": "A closed plain notebook and a pen on a kitchen counter beside a baby bottle and a folded muslin cloth in early morning light, no people.",
}
MODEL = "higgsfield-ai/soul/v2/standard"  # accepts prompt, aspect_ratio, resolution (720p | 1080p)
OUT = Path(__file__).with_name("stills"); OUT.mkdir(exist_ok=True)

def url_of(result):
    def walk(n):
        if isinstance(n, dict):
            if isinstance(n.get("url"), str): return n["url"]
            for v in n.values():
                f = walk(v)
                if f: return f
        elif isinstance(n, list):
            for v in n:
                f = walk(v)
                if f: return f
    return walk(result)

names = sys.argv[1:] or [n for n in PROMPTS if not (OUT / f"{n}.png").exists()]
failed = []
for name in names:
    last = {}
    try:
        result = higgsfield_client.subscribe(MODEL, arguments={"prompt": PROMPTS[name] + " " + STYLE, "resolution": "1080p", "aspect_ratio": "16:9"},
                                             on_queue_update=lambda s: last.update(s=s))
    except Exception as e:  # noqa
        print(f"{name}: request did not complete: {type(e).__name__}: {e}"); failed.append(name); continue
    if not isinstance(last.get("s"), higgsfield_client.Completed):
        print(f"{name}: ended as {type(last.get('s')).__name__}; no image produced"); failed.append(name); continue
    url = url_of(result)
    if not url:
        print(f"{name}: completed but no image URL returned"); failed.append(name); continue
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "atlas-media/1.0"})
        (OUT / f"{name}.png").write_bytes(urllib.request.urlopen(req, timeout=120).read())
        print(f"{name}: saved ({url.split('/')[2]})")
    except Exception as e:  # noqa
        print(f"{name}: generated but download failed: {e}\n  {url}"); failed.append(name)
sys.exit(1 if failed else 0)
