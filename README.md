# Instagram Bot Detector

Paste a public Instagram profile URL — the app fetches its followers, scores each account for bot likelihood, and returns a ranked results list with explanations.

---

## Status

| Area | State |
|------|-------|
| Frontend UI | ✅ Complete — profile input, results list, filters, score breakdown |
| Express backend | 🔨 In progress — scaffold + mock data |
| Frontend ↔ Backend | ⬜ Not started (Lesson 07) |
| Database | ⬜ Not started (Lesson 06) |
| Real Instagram scraping | ⬜ Not started (Lesson 08+) |

---

## How It Works

1. User submits a public Instagram username via the React UI
2. Express backend accepts `POST /api/analyze` with `{ username: string }`
3. Each follower is run through a scoring function — heuristic signals produce a bot score (0–100)
4. Results are returned sorted high → low, with flagged fields and human-readable reasons
5. Frontend displays color-coded rows with expandable score breakdowns

> **Right now:** the backend returns mock followers. Real Instagram scraping is a future milestone.

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript, Vite 8, Tailwind CSS v4, React Router v7 |
| Backend | Express 5 + TypeScript, ts-node, Node.js 24 |
| Database | PostgreSQL + sequelize-typescript *(planned)* |
| Scripts | Python 3 (scoring) + Bash (Instagram fetch) *(planned)* |
| CI | GitHub Actions — type-check + lint on every PR |

---

## Bot Score Reference

| Score | Risk Level | UI Color |
|-------|------------|----------|
| 75 – 100 | High Risk | Red |
| 40 – 74 | Medium | Yellow |
| 10 – 39 | Low Risk | Green |
| 0 – 9 | Real | Gray |

---

## Project Structure

```
instagram-bot-detector/
├── frontend/
│   └── src/
│       ├── pages/          # ProfileInputPage, ResultsPage
│       └── components/     # AccountRow, FilterBar, ScoreTooltip, ...
├── backend/
│   └── src/
│       ├── index.ts        # Express app + routes
│       ├── types.ts        # Follower interface + shared types
│       ├── scorer.ts       # Scoring function
│       └── mockData.ts     # Mock followers (until real scraping exists)
└── scripts/
    ├── get_followers.sh    # Fetches followers via Instagram mobile API
    └── detect_bots.py      # Scores followers for bot likelihood
```

---

## Setup

### Prerequisites

- Node.js 24+
- Python 3.10+ *(for scripts, not required to run the app)*

### Install

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### Run

```bash
# Backend (port 3001)
cd backend && npx ts-node src/index.ts

# Frontend (port 5173)
cd frontend && npm run dev
```

### Environment

Create a `.env` file in the project root (required for real Instagram scraping only):

```
SESSION_ID=your_instagram_session_id_here
```

> Get your session ID from browser DevTools → Application → Cookies → `instagram.com` → `sessionid`

---

## API

### `GET /health`
Returns `{ status: 'ok' }` — confirms the server is running.

### `POST /api/analyze`
**Request:**
```json
{ "username": "target_instagram_username" }
```

**Response:**
```json
[
  {
    "id": "1",
    "username": "free_likes_promo",
    "displayName": "Free Likes",
    "botScore": 90,
    "isKnownBot": true,
    "followerCount": 12,
    "followingCount": 7800,
    "postCount": 0,
    "createdAt": "2024-11-01",
    "flaggedFields": ["followers", "following", "posts"],
    "reasons": [
      { "text": "Known bot account", "severity": "high" },
      { "text": "Zero posts", "severity": "high" }
    ]
  }
]
```

---

## Scoring Signals

| Signal | Max Points |
|--------|------------|
| Follower / following ratio | +25 |
| Post count | +20 |
| Spam keyword in username | +20 |
| Numeric suffix in username | +8 |
| Account age | +10 |
| Known bot override | forces ≥ 90 |

Score is capped at 100. Full design in `notes/BOT_SCORING.md`.

---

## CI

GitHub Actions runs on every PR that touches `frontend/` or `backend/`:

- **Frontend:** TypeScript type-check + ESLint
- **Backend:** TypeScript type-check

PRs must pass CI before merge. Branch protection rules enforce this.
