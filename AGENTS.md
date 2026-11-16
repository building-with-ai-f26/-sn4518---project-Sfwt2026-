# AGENTS.md — Coding Agent Operating Manual

> Give this file to your coding agent and check that it is using these instructions. Keep the stack, commands, and ground rules current.

## 1. Project Overview
- **What this repo builds:** FlexWeek, a training coach that rewrites a weekly workout plan around real-life constraints (fewer days, other sports, available equipment) and gives a one-line reason for each change.
- **Primary user & core workflow:** See the living PRD in `docs/index.html`.
- **Handoff between agents (Claude Code / Codex):** read the newest entry in `journal/handoff.md` before starting; add a new entry on top before you stop (what's done, decisions, open questions, next step).
- **Tech stack (Build 2):** Plain HTML + JavaScript, no dependencies, no server, no AI calls, no API keys. Rules engine in `prototype/coach.js`; user profile (validation, BMI, on-device storage) in `prototype/profile.js`; base week (onboarding step 2: days + session type per day, saved per profile, fed to the coach as `basePlan`) in `prototype/baseweek.js`; this week's dated workouts and swaps (saved per profile) in `prototype/workoutweek.js`; UI in `prototype/index.html`. Exercise catalog (120 curated exercises with physical-equipment lists and a rule-based `alternatives()` lookup) in `prototype/exercises.js` — generated; the coach picks and swaps its exercises from it. Tests use Node's built-in test runner (Node 18+).
- **External API — wger:** [wger](https://wger.de) is a free exercise database with a public REST API (`https://wger.de/api/v2/`, read-only, no key, allows calls from any web page). When the user opens an exercise's ⓘ info bubble, `prototype/wger.js` fetches that exercise's English description from `exercise-translation/?exercise=<wgerId>&language=2`, strips the HTML to plain text and caches it in memory for the page session. Each catalog entry carries a `wgerId` (number, or `null` for no confident match) from the hand-reviewed `scripts/wger-matches.txt`. With no `wgerId`, an empty wger text or a failed call, the bubble shows the catalog's own instructions. wger text is CC BY-SA, so the bubble credits wger.de; keep that credit. Tests never call wger (they use a fake `fetch`).
- **Analytics:** the PostHog web snippet (public project key) is in the `<head>` of `docs/index.html` and `prototype/index.html`.

## 2. Commands
- **Install dependencies:** none.
- **Run locally:** open `prototype/index.html` in a browser (double-click it). `exercises.js`, `coach.js`, `workoutweek.js`, `wger.js`, `profile.js` and `baseweek.js` must stay in the same folder. Profiles, base weeks and weekly workouts are saved in the browser's localStorage on that device only. Exercise descriptions come from wger, so they need an internet connection; offline, the info bubble shows the catalog's own instructions and everything else works.
- **Run deterministic tests:** `node --test tests/` (no network needed).
- **Rebuild the exercise catalog:** edit `scripts/catalog-picks.txt` (the picks) or `scripts/wger-matches.txt` (each pick's wger id, or `-`), then `node scripts/build-catalog.js` (reads `data/exercises.json`, the public-domain free-exercise-db; writes `prototype/exercises.js`). Every pick needs a line in both files or the build stops. Never edit `prototype/exercises.js` by hand. `node scripts/exercise-db.js` looks things up in the raw db.
- **Check a wger match:** `node scripts/wger-lookup.js find <text>` lists wger exercises by name; `node scripts/wger-lookup.js show <wger id>` prints one description as the app shows it (needs internet).
- **Run model evals:** n/a yet (no model in Build 1).

## 3. Non-Negotiable Engineering Rules
1. **Plan before coding:** Before touching multiple files, propose a brief plan and wait for approval.
2. **Small batches:** Make small, focused changes that can be reviewed and explained by a human in a single Pull Request.
3. **Explainability:** Avoid unnecessary abstractions or dependencies. Help the human builder understand the main components, what changed, why it matters, what could break, and how it was checked.
4. **Verify changes:** Run relevant checks. For a reproducible logic bug, use a failing test to demonstrate the fix when practical. Record manual checks and known limitations; follow the selected Build 4 evaluation track.
5. **Zero secrets in code:** Never hardcode API keys, tokens, or credentials. Always read from environment variables (`.env`) and update `.env.example` when new variables are needed.
6. **Stop when looping:** If a fix fails twice in a row, stop, summarize what failed, and ask the human before trying a third approach.
