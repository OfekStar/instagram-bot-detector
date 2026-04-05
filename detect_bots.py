import csv
import re
import math
from collections import Counter

INPUT_FILE = "followers_ofek.yifrach.csv"
OUTPUT_FILE = "followers_bot_scores.csv"

# --- Heuristic signals (each returns 0.0–1.0) ---

def digit_ratio(username):
    """High digit ratio → more bot-like."""
    if not username:
        return 0.0
    digits = sum(c.isdigit() for c in username)
    return digits / len(username)

def trailing_digits_score(username):
    """Long trailing number sequences (e.g. 88432, 0776543) are bot signals."""
    m = re.search(r'(\d+)$', username)
    if not m:
        return 0.0
    length = len(m.group(1))
    if length >= 6:
        return 1.0
    if length >= 4:
        return 0.6
    if length >= 3:
        return 0.3
    return 0.0

def underscore_padding_score(username):
    """Leading/trailing underscores like __x__ or _x_ are mildly suspicious."""
    leading = len(username) - len(username.lstrip('_'))
    trailing = len(username) - len(username.rstrip('_'))
    total = leading + trailing
    if total >= 4:
        return 0.7
    if total >= 2:
        return 0.3
    return 0.0

def entropy(username):
    """Shannon entropy of the username characters. Very low or very high can be suspicious."""
    if not username:
        return 0.0
    counts = Counter(username)
    length = len(username)
    ent = -sum((c / length) * math.log2(c / length) for c in counts.values())
    return ent

def gibberish_score(username):
    """Detect random-looking character sequences (consonant clusters, no vowels)."""
    clean = re.sub(r'[^a-zA-Z]', '', username).lower()
    if len(clean) < 3:
        return 0.0
    vowels = set('aeiou')
    # longest consonant run
    max_run = 0
    run = 0
    for c in clean:
        if c not in vowels:
            run += 1
            max_run = max(max_run, run)
        else:
            run = 0
    vowel_ratio = sum(1 for c in clean if c in vowels) / len(clean)
    score = 0.0
    if max_run >= 5:
        score += 0.5
    elif max_run >= 4:
        score += 0.2
    if vowel_ratio < 0.15:
        score += 0.4
    return min(score, 1.0)

def username_length_score(username):
    """Very short or very long usernames are slightly suspicious."""
    length = len(username)
    if length <= 3:
        return 0.4
    if length >= 25:
        return 0.5
    if length >= 20:
        return 0.2
    return 0.0

def has_random_pattern(username):
    """Usernames that look like keyboard smash or random IDs (e.g., av447348, aoha0776543)."""
    clean = re.sub(r'[._]', '', username)
    # Pattern: short alpha prefix + long number
    m = re.match(r'^[a-zA-Z]{1,3}\d{4,}$', clean)
    if m:
        return 0.8
    # Pattern: mix of random chars and numbers with no clear name
    if re.match(r'^[a-z]{1,4}\d{3,}[a-z]*$', clean):
        return 0.5
    return 0.0

def user_id_score(user_id):
    """Very high user IDs suggest recently created accounts — more likely bots."""
    uid = int(user_id)
    if uid > 60_000_000_000:
        return 0.7
    if uid > 40_000_000_000:
        return 0.5
    if uid > 20_000_000_000:
        return 0.3
    if uid > 10_000_000_000:
        return 0.15
    return 0.0

def spammy_name_keywords(username):
    """Check for keywords common in spam/bot accounts."""
    lower = username.lower()
    keywords = ['sale', 'shop', 'buy', 'deal', 'promo', 'free', 'win',
                'follow', 'click', 'dm', 'premiumjob', 'investment',
                'crypto', 'forex', 'earn', 'money', 'income', 'closet',
                'memes', 'official']
    score = 0.0
    for kw in keywords:
        if kw in lower:
            score += 0.3
    return min(score, 0.8)

def duplicate_score(username, duplicates_set):
    """Appearing multiple times in the follower list is suspicious."""
    return 0.3 if username in duplicates_set else 0.0

def email_in_username(username):
    """Usernames containing email-like patterns (e.g., zivaosman18p723gmai)."""
    if re.search(r'gmai|yahoo|hotma|outlook|proton', username.lower()):
        return 0.7
    return 0.0

def repeated_chars_score(username):
    """Repeated characters like hhhhh, kkk (e.g., kadoshhhhh1, nemhakkk_098)."""
    m = re.search(r'(.)\1{3,}', re.sub(r'[._]', '', username))
    if m:
        return 0.4
    return 0.0


def compute_bot_score(username, user_id, duplicates_set):
    """Weighted combination of all signals → final score 0.0–1.0."""
    signals = {
        'digit_ratio':        (digit_ratio(username),                  1.5),
        'trailing_digits':    (trailing_digits_score(username),        2.0),
        'underscore_padding': (underscore_padding_score(username),     0.8),
        'gibberish':          (gibberish_score(username),              2.0),
        'length':             (username_length_score(username),        0.5),
        'random_pattern':     (has_random_pattern(username),           2.5),
        'user_id':            (user_id_score(user_id),                 2.0),
        'spam_keywords':      (spammy_name_keywords(username),         2.5),
        'duplicate':          (duplicate_score(username, duplicates_set), 1.0),
        'email_in_name':      (email_in_username(username),            2.0),
        'repeated_chars':     (repeated_chars_score(username),         1.0),
    }

    weighted_sum = sum(score * weight for score, weight in signals.values())
    max_possible = sum(weight for _, weight in signals.values())
    raw = weighted_sum / max_possible

    # Scale to 0-1 range with better spread
    # Most legit accounts score ~0.0-0.05 raw, suspicious ones 0.1-0.3+
    scaled = min(raw * 3.5, 1.0)
    return round(scaled, 3)


def main():
    # Read input
    rows = []
    with open(INPUT_FILE, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    # Deduplicate input rows (keep first occurrence) but track who appeared multiple times
    seen = {}
    username_counts = Counter(row['username'] for row in rows)
    duplicates_set = {u for u, c in username_counts.items() if c > 1}

    unique_rows = []
    for row in rows:
        if row['username'] not in seen:
            seen[row['username']] = True
            unique_rows.append(row)

    # Compute scores
    results = []
    for row in unique_rows:
        score = compute_bot_score(row['username'], row['user_id'], duplicates_set)
        results.append({
            'username': row['username'],
            'profile_url': row['profile_url'],
            'user_id': row['user_id'],
            'bot_score': score,
        })

    # Sort by bot_score descending
    results.sort(key=lambda x: x['bot_score'], reverse=True)

    # Write output
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['username', 'profile_url', 'user_id', 'bot_score'])
        writer.writeheader()
        writer.writerows(results)

    # Print summary
    high = sum(1 for r in results if r['bot_score'] >= 0.7)
    medium = sum(1 for r in results if 0.4 <= r['bot_score'] < 0.7)
    low = sum(1 for r in results if r['bot_score'] < 0.4)
    print(f"Total unique followers: {len(results)}")
    print(f"  High bot risk (>=0.7): {high}")
    print(f"  Medium risk (0.4-0.7): {medium}")
    print(f"  Low risk (<0.4):       {low}")
    print(f"\nOutput written to {OUTPUT_FILE}")
    print("\nTop 20 most suspicious:")
    for r in results[:20]:
        print(f"  {r['bot_score']:.3f}  {r['username']}")


if __name__ == '__main__':
    main()
