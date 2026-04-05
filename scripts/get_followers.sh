#!/usr/bin/env bash
set -euo pipefail

# Instagram Followers Fetcher (uses mobile API)
# Usage: ./get_followers.sh <target_username> [sessionid]
# If sessionid is not passed, it is read from .env

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/.env" ]]; then
    source "$SCRIPT_DIR/.env"
fi

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <target_username> [sessionid]"
    echo "Example: $0 ofek.yifrach"
    exit 1
fi

TARGET_USER="$1"
if [[ $# -ge 2 ]]; then
    SESSION_ID="$2"
fi

if [[ -z "${SESSION_ID:-}" ]]; then
    echo "Error: No session ID. Pass it as an argument or set SESSION_ID in .env"
    exit 1
fi
OUTPUT_FILE="followers_${TARGET_USER}.csv"
DELAY=2

# Mobile API user agent
UA="Instagram 358.0.0.0.92 Android (34/14; 420dpi; 1080x2400; samsung; SM-S926B; e2s; s5e9945; en_US; 678405678)"
APP_ID="567067343352427"

echo "--- Instagram Followers Fetcher ---"
echo "Target: $TARGET_USER"
echo ""

# Step 1: Get user ID from username (web API works fine for this)
echo "[1/3] Looking up user ID for @${TARGET_USER}..."
USER_INFO=$(curl -s "https://www.instagram.com/api/v1/users/web_profile_info/?username=${TARGET_USER}" \
    -H "cookie: sessionid=${SESSION_ID}; ds_user_id=0" \
    -H "user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
    -H "x-ig-app-id: 936619743392459" \
    -H "x-requested-with: XMLHttpRequest")

USER_ID=$(echo "$USER_INFO" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data['data']['user']['id'])
except:
    sys.exit(1)
" 2>/dev/null) || {
    echo "Error: Could not find user ID. Check your session ID and username."
    exit 1
}

FOLLOWER_COUNT=$(echo "$USER_INFO" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['data']['user']['edge_followed_by']['count'])
" 2>/dev/null || echo "unknown")

echo "  Found: User ID = $USER_ID, Followers = $FOLLOWER_COUNT"

# Step 2: Fetch followers using mobile API with pagination
echo "[2/3] Fetching followers (this may take a while)..."
echo "username,profile_url,user_id" > "$OUTPUT_FILE"

TOTAL=0
MAX_ID=""

while true; do
    if [[ -z "$MAX_ID" ]]; then
        URL="https://i.instagram.com/api/v1/friendships/${USER_ID}/followers/?count=100"
    else
        URL="https://i.instagram.com/api/v1/friendships/${USER_ID}/followers/?count=100&max_id=${MAX_ID}"
    fi

    RESPONSE=$(curl -s "$URL" \
        -H "cookie: sessionid=${SESSION_ID}" \
        -H "user-agent: ${UA}" \
        -H "x-ig-app-id: ${APP_ID}")

    # Parse response
    PARSED=$(echo "$RESPONSE" | python3 -c "
import sys, json

try:
    data = json.load(sys.stdin)
    if 'users' not in data:
        print(f'ERROR:no users key: {list(data.keys())}', file=sys.stderr)
        sys.exit(1)

    for u in data['users']:
        username = u['username'].replace(',', '')
        uid = u['pk']
        print(f'{username},https://www.instagram.com/{username}/,{uid}')

    print(f'NEXT:{data.get(\"next_max_id\", \"\")}', file=sys.stderr)
except Exception as e:
    print(f'ERROR:{e}', file=sys.stderr)
    sys.exit(1)
" 2>/tmp/ig_pagination)

    if [[ $? -ne 0 ]]; then
        echo ""
        echo "Error: $(cat /tmp/ig_pagination)"
        echo "Saved $TOTAL followers so far to $OUTPUT_FILE"
        break
    fi

    if [[ -n "$PARSED" ]]; then
        echo "$PARSED" >> "$OUTPUT_FILE"
        BATCH_COUNT=$(echo "$PARSED" | wc -l | tr -d ' ')
        TOTAL=$((TOTAL + BATCH_COUNT))
        echo "  Fetched $TOTAL followers so far..."
    fi

    MAX_ID=$(sed -n 's/^NEXT://p' /tmp/ig_pagination)

    if [[ -z "$MAX_ID" ]]; then
        break
    else
        sleep "$DELAY"
    fi
done

# Step 3: Summary
echo ""
echo "[3/3] Done!"
echo "  Total followers fetched: $TOTAL"
echo "  Output saved to: $OUTPUT_FILE"
echo ""
echo "Preview (first 10):"
echo "---"
head -11 "$OUTPUT_FILE" | column -t -s','
echo "---"

rm -f /tmp/ig_pagination
