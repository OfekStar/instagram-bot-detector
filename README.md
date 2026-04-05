# Instagram Bot Detector

Paste a public Instagram profile URL — the app fetches its followers, scores each account for bot likelihood, and returns a ranked results table.

---

## How It Works

1. User submits a public Instagram profile URL via the React UI
2. Express backend triggers the follower fetch script using a session-authenticated burner account
3. Python scoring script analyzes each username with heuristic signals (digit patterns, gibberish detection, suspicious keywords, etc.)
4. Results are returned ranked by bot confidence score (0.0–1.0)
5. Known accounts are cached in PostgreSQL to avoid re-processing on future scans

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript (Vite) |
| Backend | Express + TypeScript |
| Database | PostgreSQL + sequelize-typescript |
| Scripts | Python 3 (scoring) + Bash (Instagram fetch) |

---

## Project Structure

```
instagram-bot-detector/
├── frontend/          # React + TypeScript UI
├── backend/           # Express + TypeScript API
└── scripts/
    ├── get_followers.sh   # Fetches followers via Instagram mobile API
    └── detect_bots.py     # Scores followers for bot likelihood
```

---

## Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL (coming soon)
- An Instagram session ID stored in `.env`

### Install

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### Environment

Create a `.env` file in the project root:

```
SESSION_ID=your_instagram_session_id_here
```

> Get your session ID from browser DevTools → Application → Cookies → `instagram.com` → `sessionid`

---

## Usage

### Fetch followers for an account

```bash
cd scripts
./get_followers.sh <instagram_username>
# Output: followers_<username>.csv
```

### Score followers for bot likelihood

```bash
cd scripts
python3 detect_bots.py
# Output: followers_bot_scores.csv
```

### Bot Score Reference

| Score | Risk Level |
|-------|-----------|
| 0.7 – 1.0 | High — likely bot |
| 0.4 – 0.7 | Medium — suspicious |
| 0.0 – 0.4 | Low — probably human |

---

## Status

Work in progress. UI and database integration coming next.
