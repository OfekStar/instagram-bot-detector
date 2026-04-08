# Instagram Bot Detector — Agent Rules

## Project
User pastes a public Instagram profile URL → backend fetches followers → UI shows ranked bot score results.

## Repo Structure
```
instagram-bot-detector/
  frontend/    — Vite 8 + React 19 + TypeScript
  backend/     — Express + TypeScript (Node.js)
  BOT_SCORING.md
```

## Frontend Stack
- Vite 8 + React 19 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite` plugin — no `tailwind.config.js`)
- React Router v7 (`react-router-dom`)

## Backend Stack
- Express 5 + TypeScript + ts-node
- Port: 3001
- Entry: `backend/src/index.ts`

## Design System (Frontend)
- Background: `#0a0a0a`
- Text: white / zinc scale for muted text
- Accent: Instagram gradient — `linear-gradient(45deg, #833ab4, #fd1d1d, #fcaf45)` — available as `.ig-gradient` class in `index.css`
- Edges: sharp — avoid `rounded-xl`, `rounded-full`. Use `rounded-sm` at most
- No raw CSS — Tailwind classes only, except in `index.css`

## Account List (results view)
- List layout, NOT a table
- Each row color-coded by bot score:
  - High Risk (≥75): red left border + red tint
  - Medium (40–74): yellow left border + yellow tint
  - Low Risk (10–39): green left border + green tint
  - Real (<10): zinc/gray, visually deprioritized
- Filter buttons at top: All / High Risk / Medium / Low Risk / Real
- Always sorted high → low score

## Prompt Logging
After every response, append the user's prompt to the **current lesson's prompts file**.

### File naming
`prompts-lesson[N].md` — e.g. `prompts-lesson5.md` at repo root.

### Format
```
## Prompt [N] — [short title]
**Lesson:** [lesson number]
**Prompt:** [exact user prompt]
**What was built:** [one line summary of what you created/changed]
**Commit:** [hash] (if a commit was made this prompt, otherwise omit)
```

Always read the file before writing — never overwrite, only append. Never delete it.
The current lesson number must be tracked and used on every entry.

## Git Rules
- NEVER commit to main — always use a feature branch
- Conventional commits with body when change is non-obvious or multi-part
- Stage files by name explicitly — never `git add .` or `git add -A`
- Commit hash goes in the prompts file entry

## Skills
Always load and follow these skills when relevant:
- `git-best-practices` — use for all commits, branches, and PRs
- `documentation-writer` — use when writing or updating any `.md` files
- `find-skills` — use when a task might benefit from a skill not listed here

## Rules
- One component/file at a time — don't generate multiple files unprompted
- TypeScript only — no `any` types
- Frontend file structure: pages in `src/pages/`, reusable components in `src/components/`
- Don't modify `vite.config.ts` or `index.css` unless explicitly asked
- Don't create `tailwind.config.js` — v4 doesn't use one
