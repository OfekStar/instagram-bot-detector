#!/usr/bin/env python3
"""
Instagram Followers Fetcher — outputs JSON array to stdout
Usage: python3 get_followers.py <target_username>
Reads SESSION_ID from project root .env

All progress output goes to stderr so stdout stays clean JSON.
"""

import sys
import json
import time
import os
from datetime import datetime, timezone
from pathlib import Path
import urllib.request
import urllib.error

MAX_FOLLOWERS = 50
DELAY = 0.5  # seconds between API calls

# ---------------------------------------------------------------------------
# Load .env
# ---------------------------------------------------------------------------

def load_env() -> None:
    script_dir = Path(__file__).parent
    for env_path in [script_dir.parent / ".env", script_dir / ".env"]:
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if "=" in line and not line.startswith("#"):
                        key, _, val = line.partition("=")
                        os.environ.setdefault(key.strip(), val.strip().strip("\"'"))

load_env()

SESSION_ID = os.environ.get("SESSION_ID", "")
if not SESSION_ID:
    print(json.dumps({"error": "No SESSION_ID found in .env"}), file=sys.stderr)
    sys.exit(1)

if len(sys.argv) < 2:
    print(json.dumps({"error": "Usage: get_followers.py <target_username>"}), file=sys.stderr)
    sys.exit(1)

TARGET_USER = sys.argv[1]

UA_MOBILE = (
    "Instagram 358.0.0.0.92 Android (34/14; 420dpi; 1080x2400; "
    "samsung; SM-S926B; e2s; s5e9945; en_US; 678405678)"
)
UA_WEB = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
APP_ID = "567067343352427"

# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------

def ig_get(url: str, web: bool = False) -> dict:
    req = urllib.request.Request(url)
    if web:
        req.add_header("cookie", f"sessionid={SESSION_ID}; ds_user_id=0")
        req.add_header("user-agent", UA_WEB)
        req.add_header("x-ig-app-id", "936619743392459")
        req.add_header("x-requested-with", "XMLHttpRequest")
    else:
        req.add_header("cookie", f"sessionid={SESSION_ID}")
        req.add_header("user-agent", UA_MOBILE)
        req.add_header("x-ig-app-id", APP_ID)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

# ---------------------------------------------------------------------------
# Step 1 — resolve username → user ID
# ---------------------------------------------------------------------------

print(f"[1/4] Looking up @{TARGET_USER}...", file=sys.stderr)
try:
    profile = ig_get(
        f"https://www.instagram.com/api/v1/users/web_profile_info/?username={TARGET_USER}",
        web=True,
    )
    user_id = profile["data"]["user"]["id"]
except Exception as e:
    print(json.dumps({"error": f"Could not find user ID: {e}"}), file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Step 2 — fetch followers list (first 50)
# ---------------------------------------------------------------------------

print(f"[2/4] Fetching follower list (up to {MAX_FOLLOWERS})...", file=sys.stderr)
try:
    followers_resp = ig_get(
        f"https://i.instagram.com/api/v1/friendships/{user_id}/followers/?count=50"
    )
    raw_followers = followers_resp.get("users", [])[:MAX_FOLLOWERS]
except Exception as e:
    print(json.dumps({"error": f"Could not fetch followers: {e}"}), file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Step 3 — enrich each follower with profile info + first post date
# ---------------------------------------------------------------------------

print(f"[3/4] Fetching profile data for {len(raw_followers)} followers...", file=sys.stderr)

results = []

for i, follower in enumerate(raw_followers):
    uid = str(follower.get("pk", ""))
    username = follower.get("username", "")
    print(f"  [{i + 1}/{len(raw_followers)}] @{username}", file=sys.stderr)

    entry = {
        "id": uid,
        "username": username,
        "displayName": follower.get("full_name", "") or username,
        "followerCount": 0,
        "followingCount": 0,
        "postCount": 0,
        "createdAt": "",
        "botScore": 0,
        "isKnownBot": False,
        "flaggedFields": [],
        "reasons": [],
    }

    # --- profile info ---
    try:
        time.sleep(DELAY)
        info = ig_get(f"https://i.instagram.com/api/v1/users/{uid}/info/")
        u = info.get("user", {})
        entry["displayName"] = u.get("full_name", "") or username
        entry["followerCount"] = u.get("follower_count", 0)
        entry["followingCount"] = u.get("following_count", 0)
        entry["postCount"] = u.get("media_count", 0)
    except Exception as e:
        print(f"    Warning: could not fetch profile for @{username}: {e}", file=sys.stderr)

    # --- first post date (oldest in last 50 posts sample) ---
    try:
        time.sleep(DELAY)
        media = ig_get(f"https://i.instagram.com/api/v1/feed/user/{uid}/?count=50")
        items = media.get("items", [])
        if items:
            oldest = min(items, key=lambda x: x.get("taken_at", float("inf")))
            ts = oldest.get("taken_at", 0)
            if ts:
                entry["createdAt"] = datetime.fromtimestamp(
                    ts, tz=timezone.utc
                ).strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception as e:
        print(f"    Warning: could not fetch media for @{username}: {e}", file=sys.stderr)

    results.append(entry)

# ---------------------------------------------------------------------------
# Step 4 — output JSON to stdout
# ---------------------------------------------------------------------------

print("[4/4] Done.", file=sys.stderr)
print(json.dumps(results))
