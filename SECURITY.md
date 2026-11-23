# Security audit

## My kind of app

**No AI and no database** (Build 3, beginner lane). FlexWeek is a static HTML, CSS and JavaScript app served by GitHub Pages at https://building-with-ai-f26.github.io/-sn4518---project-Sfwt2026-/app/. Profiles, base weeks, workouts and history are stored in the browser's localStorage on each device. There is no server, shared database, sign-in, file storage or AI endpoint, so database row-level security, backups, expiring file links, rate limits and AI spending caps don't apply to this build. Per the assignment, the secret-key search is the access-control test.

## What I checked

1. **Secret keys (the required test).** I searched the repo (`git grep`) and every file the live site serves (the product page, `app/index.html` and the seven app scripts) for `sb_secret_`, `service_role`, `sk-or-`, `sk-ant-`, `sk-proj-` and `sk_live_`. I also ran a regex search in Chrome DevTools (Ctrl+Shift+F) across everything the live page loads.
   - **Result:** no matches on the live site. In the repo the only match is the placeholder `sk-or-v1-replace-with-your-key` in `.env.example`, not a real key. The only key the site carries is the PostHog `phc_` project key, which is public by design.
   - Screenshot: [`docs/build3-key-search-clean.png`](docs/build3-key-search-clean.png)
2. **Analytics privacy.** I ran a session with a fake user on the deployed app on a phone. In PostHog the replay recorded, and every label, input and button showed as masked `***`. Screenshot: [`docs/build3-posthog-replay-masked.png`](docs/build3-posthog-replay-masked.png)
3. **Dependencies.** The app has no npm or pip packages, so `npm audit` and `pip-audit` have nothing to scan. The only third-party code is the PostHog browser snippet (loaded from PostHog's servers) and data fetched from the public wger API.
4. **Agent security review.** Claude Code read the app code looking for ways to break it: HTML/script injection from profile names, saved workouts and wger text, corrupted saved data, and secrets.
5. **Agent guardrails.** `AGENTS.md` has a Shipping section and an "Ask me first" list covering deleting data, keys/secrets/permissions and anything that costs money.

## What I found

- **Session Replay was off.** Codex had disabled it for privacy, but the assignment requires replay on the live site. With it on and unmasked, recordings would capture profile details and workout numbers.
- **HTML injection from saved workout data.** The week view inserted saved exercise names, session labels, change reasons and notes into the page as raw HTML. Normally these come from the app's own catalog, but anything that can write this device's FlexWeek storage (see the next point) could plant a script that runs inside FlexWeek.
- **Shared origin on GitHub Pages.** Every project published under `building-with-ai-f26.github.io` shares one browser origin, so other class sites opened in the same browser can read and change FlexWeek's localStorage (profiles, base weeks, workout history).
- **Already safe:** profile nicknames, form errors and the history popup were already escaped. wger descriptions are stripped of HTML and shown with `textContent`. Corrupted or hand-edited saved data is validated and falls back safely (covered by existing tests).

## What I fixed

- **Replay:** PostHog Session Replay is on, as the assignment requires, but it masks every input and all page text (`maskAllInputs: true`, `maskTextSelector: '*'`). Recordings show layout and taps but not profile details or workout numbers. Autocapture is off; pageviews are on. Shipped in PR #7; verified live with the screenshot above.
- **Injection:** the week view now escapes every saved value before showing it. A new test (`tests/modes.test.js`, "saved workout text from storage is shown as text, never run as HTML") plants `<img src=x onerror=alert(1)>` in saved data and checks that it appears as plain text. It failed before the fix and passes after. 118 tests pass.
- **Guardrail:** added an `AGENTS.md` rule based on the replay mistake: agents must check the assignment requirements before switching off analytics, replay or other required features.

## What is left

- **Shared origin:** the data is workout data on the user's own device with no passwords or payment details, so I'm accepting this for now. The real fix is a separate domain (or a personal `username.github.io` site), or accounts with a real database in Build 5.
- **People sharing a device:** anyone using the same browser can open its FlexWeek profiles. That's expected for a no-sign-in app; accounts in Build 5 would address it.
- **No Content Security Policy:** the app uses inline scripts and PostHog's loader, so a strict CSP would need restructuring. Escaping covers the injection risk found above.
- **Classmate phone walkthrough:** scheduled for the pod session on Nov 24. Results will be recorded in the Build 3 log.
