"""Higgsfield SDK example: Seedance 2.5 text-to-video.

Submits one generation with the official SDK's `subscribe`, waits for it to finish and prints the
video URL. Exits non-zero, without claiming success, if the request fails, is canceled or is moderated.

Credentials: HF_KEY (key-id:key-secret) is read from .env.local at runtime and never printed.
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env.local"))
if not os.getenv("HF_KEY"):
    sys.exit("HF_KEY is not set. Copy .env.local.example to .env.local and add your key-id:key-secret.")

import higgsfield_client  # noqa: E402  (import after the environment is loaded)

MODEL = "bytedance/seedance-2.5/text-to-video"
ARGUMENTS = {
    "prompt": "A cinematic scene at sunset",
    "duration": 5,
    "resolution": "720p",
    "aspect_ratio": "16:9",
}


def find_video_url(result):
    """Return the first video URL in the result payload, whatever its exact shape."""
    def walk(node, under_video=False):
        if isinstance(node, dict):
            for key, value in node.items():
                is_video = under_video or "video" in key.lower()
                if key == "url" and isinstance(value, str) and (under_video or value.split("?")[0].lower().endswith((".mp4", ".webm", ".mov"))):
                    return value
                found = walk(value, is_video)
                if found:
                    return found
        elif isinstance(node, list):
            for item in node:
                found = walk(item, under_video)
                if found:
                    return found
        return None
    return walk(result)


def main():
    last = {"status": None, "name": None}

    def on_enqueue(request_id):
        print(f"Request enqueued: {request_id}", flush=True)

    def on_queue_update(status):
        name = type(status).__name__
        if name != last["name"]:
            print(f"Status: {name}", flush=True)
        last["status"], last["name"] = status, name

    try:
        result = higgsfield_client.subscribe(MODEL, arguments=ARGUMENTS, on_enqueue=on_enqueue, on_queue_update=on_queue_update)
    except higgsfield_client.HiggsfieldClientError as error:
        sys.exit(f"Request rejected by the API: {error}")
    except Exception as error:  # network or protocol failure
        sys.exit(f"Request did not complete: {type(error).__name__}: {error}")

    status = last["status"]
    if isinstance(status, higgsfield_client.NSFW):
        sys.exit("Generation was blocked by content moderation. No video was produced.")
    if isinstance(status, higgsfield_client.Cancelled):
        sys.exit("Generation was canceled. No video was produced.")
    if isinstance(status, higgsfield_client.Failed):
        detail = result.get("error") or result.get("detail") if isinstance(result, dict) else None
        sys.exit(f"Generation failed. No video was produced.{' Reason: ' + str(detail) if detail else ''}")
    if not isinstance(status, higgsfield_client.Completed):
        sys.exit(f"Generation ended in an unexpected state: {last['name']}.")

    url = find_video_url(result)
    if not url:
        sys.exit(f"Generation completed but no video URL was found. Keys returned: {sorted(result) if isinstance(result, dict) else type(result).__name__}")
    print(f"Video URL: {url}")


if __name__ == "__main__":
    main()
