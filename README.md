# Instagram Bot Detector

_Last updated: 2026-04-25_

Paste a public Instagram profile URL — the app fetches its followers, scores each account for bot likelihood, and returns a ranked results list with explanations.

---

## Status

| Area | State |
|------|-------|
| Frontend UI | ✅ Complete — profile input, results list, filters, score breakdown |
| Express backend | ✅ Complete — POST /api/analyze with scoring engine |
| Database | ✅ Complete — PostgreSQL + sequelize-typescript, known_bots cache |
| Frontend ↔ Backend | ✅ Complete — real API calls, no mock data |
| Real Instagram scraping | ✅ Complete — Python scraper via session cookie |
| Unit tests | ✅ Complete — Vitest, scorer.ts covered |
| E2E tests | ⬜ Not started |
| Deploy | ⬜ Not started |

---

## How It Works

1. User submits a public Instagram username via the React UI
2. Express backend accepts `POST /api/analyze` with `{ username: string }`
3. Each follower is checked against the `known_bots` DB cache — if a fresh result exists (< 7 days old) it's returned immediately
4. On a cache miss: the scoring function runs heuristic signals to produce a bot score (0–100), then saves the result to PostgreSQL
5. Results are returned sorted high → low, with flagged fields and human-readable reasons
6. Frontend displays color-coded rows with expandable score breakdowns

> **Right now:** real Instagram followers are fetched via a Python scraper using a session cookie. Results are cached in PostgreSQL.

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript, Vite 8, Tailwind CSS v4, React Router v7 |
| Backend | Express 5 + TypeScript, ts-node, Node.js 24 |
| Database | PostgreSQL 16 + sequelize-typescript |
| Scripts | Python 3 (Instagram fetch via session cookie) |
| CI | GitHub Actions — type-check + lint on every PR |

---

## Architecture

**Separation of concerns:** `scorer.ts` is a pure function — it takes a `Follower` object and returns a score. It never touches the database. `index.ts` owns fetching: it gets followers (from DB cache or the Python scraper), then passes each one to `scoreAccount()`. This makes the scoring logic easy to test in isolation without a running database.

```
Python scraper → index.ts (fetch + cache) → scoreAccount() → response
```

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
│       ├── mockData.ts     # Mock followers (until real scraping exists)
│       ├── db.ts           # Sequelize connection
│       └── models/
│           └── KnownBot.ts # known_bots table model
└── scripts/
    └── get_followers.sh    # Fetches followers via Instagram mobile API
```

---

## Setup

### Prerequisites

- Node.js 24+
- PostgreSQL 16 (`brew install postgresql@16 && brew services start postgresql@16`)
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

### Database Setup

```bash
createdb instagram_bot_detector
```

The `known_bots` table is created automatically when the backend starts.

### Environment

Create `backend/.env` (required to run the backend):

```
DB_NAME=instagram_bot_detector
DB_USER=postgres
DB_HOST=localhost
DB_PORT=5432
```

For real Instagram scraping, also create a `.env` in the project root:

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
- **Backend:** TypeScript type-check + ESLint

PRs must pass CI before merge. Branch protection rules enforce this.
