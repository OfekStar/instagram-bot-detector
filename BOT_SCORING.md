# Bot Scoring — Design Document

## Overview

Each follower account receives a **bot score from 0 to 100**.
Higher = more likely a bot. The score is a weighted sum of signals derived from
publicly available profile data.

---

## API Contract

The backend must return a list of scored followers matching this shape:

```ts
interface Follower {
  id: string;
  username: string;
  displayName: string;
  botScore: number;       // 0–100
  isKnownBot: boolean;
}
```

Endpoint suggestion:
```
GET /api/analyze?profile=<username>
→ { followers: Follower[] }
```

---

## Risk Thresholds (used by frontend)

| Score  | Label     |
|--------|-----------|
| 75–100 | High Risk |
| 40–74  | Medium    |
| 10–39  | Low Risk  |
| 0–9    | Real      |

---

## Scoring Signals

### 1. Follower / Following Ratio (weight: 25)
Bots typically follow thousands but have very few followers.

```
ratio = followers / max(following, 1)
if ratio < 0.05 → +25
if ratio < 0.1  → +15
if ratio < 0.3  → +8
```

### 2. Post Count (weight: 20)
Bots often have zero or very few posts.

```
if posts == 0       → +20
if posts <= 3       → +12
if posts <= 10      → +5
```

### 3. Username Pattern (weight: 20)
Regex-based heuristics on the username string.

Suspicious patterns:
- Long numeric suffix (e.g. `user_48291`)
- Random character sequences (e.g. `xkqztmw`)
- Known spam keywords: `follow4follow`, `free_likes`, `buy_ig`, `promo`, `boost`, `auto_`
- Excessive underscores or dots

```
if matches known spam keyword → +20
if matches random string pattern → +12
if has long numeric suffix → +8
```

### 4. Profile Picture (weight: 15)
Default or missing profile picture is a strong bot indicator.

```
if no profile picture (default avatar) → +15
```

### 5. Bio (weight: 10)
Empty bio or bio containing spam/promo links.

```
if bio is empty → +5
if bio contains promo keywords ("DM for collab", "link in bio" + no posts) → +10
if bio contains suspicious URLs → +8
```

### 6. Account Age (weight: 10)
Very new accounts are more likely bots (if accessible).

```
if account < 30 days old  → +10
if account < 90 days old  → +5
```

### 7. Display Name (weight: 5)
Missing or generic display name.

```
if display name is empty → +5
if display name matches username exactly → +2
```

### 8. Known Bot List (override)
Cross-reference username against a known bot database or blocklist.

```
if username in known_bots_list → isKnownBot = true, score = max(score, 90)
```

---

## Final Score Calculation

```python
score = sum of all matched signal weights
score = min(score, 100)  # cap at 100
```

No normalization needed — weights are tuned so a "perfect bot" hits ~100
and a real human with normal activity hits 0–10.

---

## Data Sources

1. **Instagram unofficial API / scraping** — fetch follower list + basic profile info
   - Username, display name, bio, post count, follower count, following count, profile pic URL
2. **Known bot blocklist** — maintain a static or periodically updated list of confirmed bot usernames
3. **CSV data already in repo** — `followers_ofek.yifrach.csv` and `followers_bot_scores.csv` can be used to validate and calibrate weights

---

## Calibration

Use the existing CSVs in the repo root (`followers_bot_scores.csv`) to test signal accuracy:
- Run scoring against known-labeled accounts
- Adjust weights until precision/recall on "high risk" is acceptable
- Aim for high precision on High Risk (don't want false positives) and high recall on Known Bots
