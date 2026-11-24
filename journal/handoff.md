# Agent handoff log

## 2026-11-24 — Claude Code: Week strip replaces the Next workout banner

- Correction to the entry below: PR #11 (`db79cc0`) already merged the redesign and day-picker work into `main`, so it is live. `gh` is logged in and working.
- The user found the banner confusing: its exercise rows looked tappable but weren't, and it repeated the day picker. At the user's request, removed the banner (`gym-hero`, `gym-preview`, the `gym-start` handler, `nextWorkoutIndex`, and the now-unused `boxing-gym.jpg`). In its place is a 7-tile Mon–Sun strip (`renderWeekStrip` in `docs/app/index.html`; styles in `gym-floor.css`). Days with workouts in the base routine are orange and show the session name. Days logged this week get a green check. The strip shows no dates (the user asked for that), has a legend, can't be clicked, and appears only in the day preview.
- The user liked the photo banner and only disliked its unclear workout list, so `boxing-gym.jpg` is restored. It is now the backdrop of the week strip, under a visible "This week" heading.
- Edit profile now shows only the form (one narrow column). Workout history appears only from the Workout History button. Renamed the layout class `creating` to `form-only`. Updated the PRD workout history line to match.
- Replaced the Start workout banner test in `tests/modes.test.js` with a week strip test. 117 tests pass. Checked in headless Edge at 1280 px and in a 390 px frame using a seeded test profile.
- **Live:** committed as `5f81407` (week strip) and `fd745cc` (photo restored, Edit profile shows only the form). PR #12 merged them into `main` (`1b1deee`). The Pages deploy succeeded, and the live `/app/` serves the week strip and `boxing-gym.jpg`.
- Open: in the history list the date and type run together ("Mon, Nov 23, 2026Logged workout"). This is a one-line CSS fix that has been offered but not done. The strip follows the base routine, not this week's edits. Still to do: check on a physical phone. Next deadlines: Pod check-in Wed Nov 25 at noon and Build 4 Mon Nov 30 at noon (track not chosen).

## 2026-11-24 — Codex: Resume checkpoint

- Confirmed the workout preview, logging and editing changes are pushed to build-3-pages at 712eea7. All 117 tests pass. GitHub CLI returned 401 when checking PR status.
- Next: verify the dated day picker and workout flow on a physical phone before publishing. No app changes this session.

## 2026-11-24 — Codex: Day preview, logging and editing

- Implemented the approved dated day picker and separate Start workout and Edit this day actions. Logging no longer shows routine editing controls. Back and Done return to the selected date. Logged dates offer read-only results and rest days offer no workout actions.
- Verified 117 automated tests, including preserving a logging draft through the edit flow and preventing swaps during logging. Reviewed the three views at 390 px before moving the actions above the exercise list. Physical-phone verification remains pending.

## 2026-11-24 — Codex: Gym Floor redesign

- Implemented the approved contemporary boxing-gym visual direction in the local app. The start screen highlights the next unlogged session in the current week and opens its workout log. Logging emphasizes lift names, previous results and number entry. Workout History is now reachable directly from the planner. Existing rules, storage formats, analytics and AGENTS.md are unchanged.
- Verified 119 automated tests, including the new Start workout regression test. Inspected the desktop start screen and the logging screen at a 390 px viewport in headless Edge with a synthetic profile. The changes are local. Next: check on a physical phone before publishing.

## 2026-11-24 — Codex: Mobile workout UX critique

- Reviewed how users choose a workout, log it, and reopen history. Priorities: expose history from Your week, clarify workout dates and save behavior, and resolve the mismatch between weight-only entries accepted by logging and the positive-rep history filter. That filter was previously requested, so confirm the intended behavior before changing it. Browser rendering was unavailable. No app or AGENTS.md changes.

## 2026-11-24 — Codex: Impeccable installation scope

- The project-folder installer did not complete and left no installation files in the repo. Impeccable already exists under the user-level `.agents/skills` directory. No reinstall needed.

## 2026-11-24 — Codex: FlexWeek project catch-up

- Reviewed the living PRD, build log, security audit, and Build 4/5 notes. Build 3 was submitted. The Nov 24 classmate phone walkthrough has no recorded result, and the Build 4 evaluation track has no recorded selection. Build 4 is due Nov 30 at noon New York time.
- Next: capture the walkthrough outcome when available and confirm the Build 4 track. The PRD proposes Modify remaining workouts. Accounts and cross-device history still need a scope and timing decision. No app changes or fresh test run in this session.

## 2026-11-24 — Codex: Windows desktop update prompt

- Found a Codex desktop package path at 26.1117.4957.0 and a separate npm CLI at 0.171.0. Windows denied access to package registration and deployment logs in this session. Cause of repeated prompt remains unverified. Next check: Microsoft Store update status and desktop version before and after updating.

## 2026-11-23 — Claude Code: Build 3 SUBMITTED (start here)

### Status
- **Submitted on Icerynk:** Mon Nov 23 at 11:12 AM NY, before the noon deadline. Link: live app `/app/`. Note: repo, Beginner lane, SECURITY.md, product page. Uploads: `build3-key-search-clean.png` and `build3-posthog-replay-masked.png`. Grade not released yet.
- **`main` is live** at https://building-with-ai-f26.github.io/-sn4518---project-Sfwt2026-/ (app at `/app/`). 118 tests pass.
- **GitHub CLI works now.** `gh auth status` shows it's logged in as the user's account with `repo` scope, so the earlier 401 is gone. Agents can create and merge PRs themselves. The user asked agents to handle GitHub steps rather than handing them back.

### PRs merged today (all from `build-3-pages`)
| PR | Merge | What |
|---|---|---|
| #6 | `ad310b4` | Move app to `docs/app/`, publish via GitHub Pages (Codex, merged in GitHub UI) |
| #7 | `b39aa05` | Session Replay back on with `maskAllInputs` + `maskTextSelector: '*'` |
| #8 | `10a65c0` | Escape saved workout text in `renderResult()` + regression test; SECURITY.md rewrite; AGENTS.md rules 7–8; Build 3 log + screenshots; ~12 h / $0 |
| #9 | `9e08368` | PRD v3 section 4: Hosting, Database, Security paragraphs; refreshed analytics + cost lines |
| #10 | `cea120e` | "What broke" bullet in Build 3 log; analytics claim limited to the verified masked replay |

### Decisions and findings
- **Replay:** the assignment requires replay on the live site, so it's on but fully masked. The user verified it on their phone; the screenshot is in `docs/`. Pageview events in PostHog Activity were never checked, so don't claim them.
- **Security:** the live key search is clean across 9 files. The repo only has the `.env.example` placeholder. The real finding: the shared `building-with-ai-f26.github.io` origin means other class sites can read and write FlexWeek's localStorage. Injection is fixed; the shared storage itself is an accepted risk, documented in SECURITY.md.
- **AGENTS.md:** rule 7, check the assignment before turning off required features (the real replay mistake). Rule 8, always escape stored or fetched text before `innerHTML`.
- **Hours and spend:** Build 3 ≈ 12 h (user said "3 more" than Build 2's 9). $0 extra; cumulative $0.

### Next steps
1. **Nov 24 class:** a classmate does the full phone walkthrough (profile → base week → modify → log a day → history). Record results and any fixes in the Build 3 log and SECURITY.md "What is left". This was the only unmet Build 3 item at submission.
2. **User accounts plus a real database.** The user says browser-only storage "is simply not realistic". The user asked if this fits in 1 hour; the answer was no, realistically 4–6 h, so it was deferred until after Build 3. Recommended plan, to be proposed and approved before coding:
   - Supabase Auth (magic link or Google) and Postgres tables with `user_id` and Row Level Security, still hosted on GitHub Pages with the publishable key.
   - Keep code changes small by swapping the injected `storage` object for one backed by Supabase (load on sign-in, write-through).
   - Then run the Account A vs. B security test and update SECURITY.md and the PRD.
   - Creating the Supabase project and keys is on "Ask me first", so the user creates the account.
   - Check with the user whether this goes in Build 4 or Build 5.
3. **Whoop, later:** OAuth needs a client secret, so it needs a server-side token exchange (e.g. a Supabase Edge Function) and per-user token storage behind RLS. Accounts are a prerequisite.
4. **Still pending from earlier:** user review of the 42 unmatched wger exercises; Add-menu search; UI polish; "Modify remaining workouts".

## 2026-11-23 — Claude Code: Build 3 security review and evidence

- PR #7 (`b39aa05`) is live with masked replay; the user's phone session confirmed masking in PostHog. The live key search is clean (9 files, 0 matches). Screenshots: `docs/build3-posthog-replay-masked.png`, `docs/build3-key-search-clean.png`.
- Security review found that saved workout data was rendered as raw HTML in `renderResult()`. Because the github.io origin is shared by every class site, that's a real injection path. Fixed with `esc()` plus a failing-then-passing test (118 pass). SECURITY.md rewritten; AGENTS.md rules 7 (replay mistake) and 8 (escaping) added; Build 3 log updated.
- Still open: hours and agent spend in the log, the classmate walkthrough (written as scheduled for the Nov 24 pod session; the user hasn't confirmed), and the Icerynk submission before noon.

## 2026-11-23 — Claude Code: Session Replay back on (masked)

- PR #6 merged to `main` as `ad310b4`. Build 3 assignment requires PostHog + Session Replay working on the live site, so replay is re-enabled in `docs/app/index.html` with `maskAllInputs` and `maskTextSelector: '*'`. Autocapture stays off. SECURITY.md, product-page log and Build 3 notes updated. 117 tests pass. Repo key search: only the `.env.example` placeholder.
- Not yet committed/pushed. Remaining before noon: deploy, fresh fake-user session on the live app (checks replay masking + events), live key search screenshot, agent security review, an AGENTS.md rule from a real agent mistake, hours/spend, classmate walkthrough, Icerynk submission.

## 2026-11-23 — Codex: Icerynk MCP availability

- Confirmed Icerynk is configured as a custom MCP server in the user-level Codex config. This session exposes no Icerynk tools, so authenticated data access is unverified. Plugin directory search returned no match. Configuration was not edited.

## 2026-11-23 — Codex: Icerynk access check

- No dedicated Icerynk connector was exposed. Found the existing Build 3 course window in Chrome, but it was minimized and the browser access host was unavailable. Current page contents and tools were not verified. The previous handoff records read-only access to Agentic Angie.
- Next step if needed: bring the Icerynk window to the foreground and retry the read-only check.

## 2026-11-22 — Codex: Icerynk agent access

- Verified the signed-in course agent page through School Chrome. Agentic Angie is read-only, has three event triggers, and has no recurring schedule despite the day-before reminder instruction. No Icerynk settings changed.
- No follow-up requested.

## 2026-11-22 — Codex: Build 3 deployment and documentation

- Beginner lane. Deployment commit `d9a62a1` was pushed on `build-3-pages`. GitHub CLI returned 401, so Sebastian opened the PR in GitHub. Sebastian confirmed using the deployed app successfully on his phone. His earlier fake-profile walkthrough was local. The automated suite passed all 117 tests.
- Updated the living PRD, public Build 3 log, working notes, and security audit draft. App PostHog settings retain pageviews and disable replay and autocapture. Personal accounts and private cross-device workout history are future scope.
- Pending before Icerynk submission: confirm PR/merge metadata, get a classmate through the whole workflow on their phone, check live PostHog with fake data, search the deployed files for private keys and capture a screenshot, and record actual time and spend. Submit the live URL, repo, beginner lane, audit link, and screenshot by Nov 23 at noon New York time.

## 2026-11-22 — Codex: Build 3 app move

- Beginner lane. Moved the static app to `docs/app/`, updated the product link, test paths, catalog generator and local instructions, and documented the shipping workflow.
- Next: verify deployment and the complete phone workflow, review PostHog capture on the public app, and finish `SECURITY.md` and the public build log. The slides specify a live URL, repo and lane, audit link, and screenshot of the security test. FlexWeek has no database or AI endpoint, so the applicable live test is the private-key search.

## 2026-11-17 — Codex: publishing and merging local work

- User explicitly requested commit, GitHub push and merge, superseding the prior local-only preference.
- Publishing all local work on build-2-profile-onboarding: logging modes and storage, add/remove exercises, profile workout history with clickable read-only details, temporary whole-day type changes, and the subtle blue type-label selector.
- Latest validation before publication: 117 tests pass. Visual desktop/phone checks remain outstanding; user manually reported history and whole-day replacement working. No product-page/build-log rewrite included.
- GitHub CLI reports 401, but Git fetch works. Merge through Git into latest origin/main, then push main and feature branch. Check remote refs to confirm completion.
- Next session: read this handoff, check current branch/status. Pending product work from earlier summary includes UI polish/search, remaining-workout planning, wger unmatched exercise review, and Build 3 documentation. Do not assume any new feature is approved.

---

## 2026-11-17 — Codex: subtle workout type label selector

- User approved replacing the separate Change workout type control with the existing blue session label as a compact native select. Only selected unlogged dates in Modify Current Week are interactive; other labels remain spans.
- Kept blue pill styling with native dropdown arrow, subtle hover border and visible keyboard focus. Current type is selected. Tooltip explains replacement/unsaved-number clearing. Removed separate selector and its hint paragraph. Workout logic is unchanged.
- Validation: all 117 tests pass; git diff --check passes. Visual browser/mobile checks remain outstanding due to the prior browser-control blocker.
- Local only, no push. Next: user checks the subtle label selector.

---

## 2026-11-17 — Codex: temporary whole-day workout type changes

- Approved scope: in Modify Current Week, selected unlogged workout dates have Change workout type. Choosing Upper/Lower/Full Body/Push/Pull/Legs replaces the day's exercises with defaults using the existing coach, clears all unsaved numbers for that date, and removes its earlier edit explanations. Logged dates and rest days cannot be changed here. Base workout and history are untouched.
- Weekly record now saves `basePlan` snapshot and `temporaryDays` indexes. Temporary choices survive reload/profile navigation, apply only to this week's record, and are discarded on explicit base-workout save (even unchanged base) or detected base-plan changes. Logged dates remain final. Normal unchanged base days retain their existing exercise edits.
- Base-save reset passes through openMain/setBasePlan/openWorkout; cancelling base edits or editing profile does not reset temporary choices. Replacing a temporary routine via a base save also clears that date's draft numbers.
- Validation: node --test tests/ = 117 pass, 0 fail; git diff --check passed. New tests cover defaults, drafts, reload, other days, reset, locked/rest/unselected dates, invalid types and log-mode guard. Desktop/phone visual checks remain outstanding due to the earlier browser-control blocker.
- Local changes only; no push. Next: user checks the selector and replacement flow in the browser.

---

## 2026-11-17 — Codex: Workout History popup, Step 2

- User approved clickable history dates and a popup showing workout type, exercises with reps >0, sets, reps and weight in lb.
- Date buttons now open a read-only native dialog for the edited profile's saved date. Positive-rep exercises include bodyweight entries (0 lb); weight-only entries with 0 reps are excluded as requested. Empty positive-rep days have a clear message; legacy workout types remain "Logged workout".
- Popup scrolls at 80vh, supports Close, native Escape/focus handling, and outside click. Screen changes close it. No storage format changes.
- Validation: 114 tests pass, including popup date selection, profile isolation, positive-rep filtering, escaped names, legacy labels, unchanged saved data and close/outside-click behavior. Browser visual desktop/mobile checks remain outstanding after the prior session's browser automation blocker; native Escape/focus behavior is not exercised by the fake-page test.
- Keep local; nothing pushed. Next: user checks popup appearance on desktop/phone.

---

## 2026-11-16 — Codex: Workout History panel, Step 1

- User approved Step 1 only: right side of Edit Profile has a scrollable saved-date/type list, newest first, scoped to the edited profile. At widths <=820px it stacks below the form. Hidden when creating a profile; empty state for no logs.
- Added history store `listDays()`. Future logged days preserve `workoutTypes`; legacy dates show "Logged workout" rather than inferring a type from the current base plan.
- Step 2 remains unapproved and unimplemented: clickable dates and a read-only popup with the saved routine. Old records do not retain skipped exercises or change explanations.
- Validation: `node --test tests/`: 113 pass, 0 fail; `git diff --check` passed. Storage tests cover ordering, profile isolation, legacy types and corrupt storage.
- Chrome reloaded the updated file, but visual checks could not finish: browser host unavailable; native click failed with unavailable geometry and subsequent attempt was interrupted by detected user input. Stopped after two attempts per repo rule. Desktop/mobile layout, populated list and scrolling still need visual checks.
- Work stays local. Next: user reviews Step 1; resolve visual verification before requesting Step 2 approval.

---

Shared notes so work can move between Claude Code and Codex. Newest entry on top.
Agents: read the latest entry before starting, and add a new one before you stop.

---

## 2026-11-16 — Claude Code: SESSION SUMMARY for Codex (start here)

The user is switching to Codex. This entry sums up the whole Claude Code session: what's done, the rules agreed, and the plan. The detailed entries below have more on each step.

### Where things stand
- **Branch:** `build-2-profile-onboarding`. Working tree clean. 8 local commits ahead of `origin/build-2-profile-onboarding`; none pushed.
- **User preference:** keep this work **local**. Don't push, open PRs or merge into `main` unless the user asks. Build 2 is already submitted, and the Product Page on `main` stays as it was merged this morning.
- **Tests:** `node --test tests/` → **112 pass**, 0 fail.
- **Process the user expects:** propose a short plan with risks before multi-file changes and wait for OK (AGENTS.md rule 1). One small commit per step. Add a handoff entry before stopping. Check in Chrome (temporary localhost server), including phone width.

### Commits this session (oldest first)
1. `f04152d` Two modes in "Your week": **Modify Current Week** / **Log Today's Exercise**. Renamed "Edit base week" → **Edit Base Workout**, with matching on-screen wording.
2. `fe9fbfc` Swaps allowed in Log mode too; removed the duplicate top-bar Edit Base Workout button (the left-card one stays).
3. `38950fa` `prototype/history.js` (workout history storage) + `tests/history.test.js`.
4. `5e6cf82` Logging UI: Sets / Reps / Weight (lb) boxes, grey last-result placeholders, drafts, **Save Logged Day**, final logged days.
5. `8c8d265` Journal note: a separate history screen is needed.
6. `5872821` Add or remove exercises on the selected day, in both modes.

### What the app does now (prototype/index.html)
- **Edit Base Workout** (left card): the permanent usual week. Saving it changes this week and every week after. On this week's days: unchanged session types keep swaps and hand edits, and logged days are never touched.
- **Modify Current Week** (this week only): pick any weekday from "Current workout day". On that day you can swap exercises for equivalent ones, remove an exercise ("✕ Remove") or add one ("+ Add exercise…": the whole catalog the equipment allows, grouped by main muscle, minus those already in the day). Edits are listed under "What changed & why" as "Your edit". Adding back what was removed, or removing what was added, cancels the earlier line.
- **Log Today's Exercise:** shows only the selected day, with the same swap, add and remove controls.
  - **Boxes:** each exercise has Sets, Reps and Weight (lb). The grey placeholder in each box is the last saved result **of the exercise currently in that row** (by exercise id, so it follows swaps and adds), or "–" if it was never logged.
  - **Drafts:** typed numbers are kept per person and date, so they survive redraws and reloads.
  - **Save Logged Day** (one click, no confirm) saves under the **date of the selected weekday** in this week:
    - an exercise with Reps and Weight both 0 or blank is skipped
    - if either is above 0, it's stored
    - a blank Sets box stores the planned sets
    - limits: sets 1–20 and reps 0–100 (whole numbers), weight 0–2000 lb
    - nothing filled in shows a message instead of saving
  - **A saved day is final** in both modes: it shows "Logged ✓", lines like "3 sets × 8 reps · 135 lb" or "Skipped", and no swap, add, remove or Save controls.
- **Rules for editing a day** (one shared guard, `changeableSession()`): only the selected day of the current week, and never a logged day.
  - no adding on rest days
  - a workout keeps at least one exercise
  - no duplicate exercise in a day
  - no confirm on Remove

### Data on the device (localStorage, per profile)
- `flexweek:week:<profileId>`: base workout (unchanged).
- `flexweek:workouts:<profileId>:<monday>`: this week's record. Hand edits add `addReason` on exercises and `changes` entries `{ kind: 'manual', action: 'add'|'remove', day, exerciseId, text }`.
- `flexweek:history:<profileId>` → `{ version: 1, days: { '<date>': { week, day, savedAt, exercises: [{ id, name, sets, reps, weight }] } } }`. A date can't be saved twice.
- `flexweek:draft:<profileId>:<date>` → `{ '<exerciseId>': { sets, reps, weight } }` (typed text). Cleared on save.

### Code map for these features
- `prototype/history.js`: `dateOf`, `readResult` (box values to result, skipped or error), `createHistoryStore` (`loadDay`, `saveDay`, `lastResult`, `loadDraft`, `saveDraft`, `clearDraft`).
- `prototype/coach.js`: new `addableExercises(equipment)` and `addExercise(id, equipment)`, next to `swapExercise`.
- `prototype/index.html`:
  - `mode` and `setMode()`; `renderResult()` draws the boxes, Save button, logged view, and Remove and Add controls
  - `saveLoggedDay()`, `changeableSession()`, `noteEdit()`, `removeExercise()`
  - `openWorkout()` keeps logged days and carries `manual` changes over when the base workout changes
- Tests:
  - `tests/modes.test.js`: modes, logging, add/remove, using a fake page on a fixed Friday
  - `tests/history.test.js`
  - `tests/swaps.test.js`: coach add helpers
  - The test pages' fake `closest()` must honour its selector, because the `#week` click handler checks `[data-save-day]`, then `[data-remove]`, then `[data-info]`.

### Plan, still to do (user's priorities; propose a plan with risks before each)
1. **Separate screen for historicals** (user asked to keep this on the list): past logged days and weeks per person, read from `flexweek:history:<id>`. The grey placeholders don't replace it. Not designed yet.
2. **Change this week's days only:** add or remove a workout day this week, and move a workout to another day, without touching the base workout. Design first: today `openWorkout()` compares the week to the base workout and rebuilds days that differ, so a week-only move would snap back on reload. The week record must remember the base it was built from. Open question for the user: if the base workout is edited after week-only changes, do the week-only changes stay? My recommendation was yes, with the base applying from next week. Adding exercises to a rest day was deliberately left for this step.
3. **UI pass** ("improving the UI"):
   - Log-mode hint still says "you can still swap its exercises" on a logged day
   - Add menu needs search (~120 options)
   - general polish; Chrome screenshots of the tab timed out last time, so the layout was checked through the page's code, not by eye
4. **"Modify remaining workouts" button** (2026-11-13 entry below): partly overlaps with step 2. Revisit after it.
5. **Whoop analytics** (new feature, later): Whoop uses OAuth with a client secret, which can't be hidden in this no-server app, so it needs a backend. Keep it for a later build.
6. **Other pending items:**
   - user review of the 42 unmatched wger exercises (`scripts/wger-matches.txt`, `-` lines; don't change them without the user)
   - `docs/index.html` (Product Page) and AGENTS.md wording still say "base week" in places; AGENTS.md lists `history.js`
   - Product Page and build log not updated for these features (nothing merged by request)
   - Build 3 is due Mon Nov 23, 12:00 PM, and its log in `docs/index.html` is still blank

### Known limits
- Swapping an added exercise keeps the "Added X" line under the old name.
- The coach doesn't recheck volume or recovery after hand edits.
- All data is in one browser on one device; clearing site data loses history.
- Chrome checks used an existing test profile on `http://127.0.0.1:8765`. That origin now has Monday 2026-11-16 logged and Wednesday edited (test data only).

---

## 2026-11-16 — Claude Code: add or remove exercises, in both modes

**Done (user approved the plan):**
- On the selected day, in both Modify Current Week and Log Today's Exercise, every exercise row has a "✕ Remove" button next to ⓘ.
- Each workout table has a "+ Add exercise…" menu: every catalog exercise the equipment allows, grouped by main muscle with `<optgroup>`, leaving out exercises already in that day.
- An added exercise goes at the end of that workout with 3 sets, its muscle group and an "Added by you." note. In Log mode it gets its own boxes and grey history.
- Each edit is listed under "What changed & why" as "Your edit" (kind `manual`, with `day`, `action`, `exerciseId`). Adding back what was removed, or removing what was added, cancels the earlier line.
- Hand edits survive a Base Workout edit when that day's session type is unchanged (they're carried over in `openWorkout()`).
- New coach helpers: `addableExercises(equipment)` and `addExercise(id, equipment)` in `prototype/coach.js`.
- One shared guard, `changeableSession()` in `index.html`, now covers swap, add and remove.

**Rules:**
- Only the selected day of this week, and never a logged day.
- Not on rest days: that would create a workout day, which belongs to "change days this week".
- A workout keeps at least one exercise.
- No duplicates in a day: history and drafts are stored by exercise id.
- No confirm on Remove.

**Verification:** `node --test tests/`: 112 pass (1 new coach test in `swaps.test.js`, 4 new page tests in `modes.test.js`). In Chrome (temporary localhost server):
- Removed and added an exercise on Wednesday. The edit list showed both, Log mode showed Leg Press's boxes, and the edits survived a reload. Logged Monday had no Remove buttons. No console errors.
- Screenshots of the tab kept timing out, so these checks went through the page's own code instead of by eye.
- At 390px, the Remove button wrapped onto two lines; fixed with `white-space: nowrap`. Neither the page nor the table scrolls sideways now.

**Known limits:**
- Swapping an added exercise keeps the "Added X" line under the old name.
- The coach doesn't recheck volume or recovery after hand edits.
- The Add menu has ~120 options; search could come in the UI pass.

**Still on the list:** the separate history screen (see entry below); changing days for this week only; the UI pass.

---

## 2026-11-16 — Claude Code: roadmap note, separate history screen; next is add/remove exercises

**Remember (user request):** FlexWeek needs a **separate screen to see historicals**: past logged days and weeks, per person, from `history.js`. The grey placeholders in Log mode don't replace it. It isn't scheduled yet; keep it on the list and raise it when choosing next steps.

**Agreed next step:** add or remove exercises in a day, this week only, **available in both modes** (Modify Current Week and Log Today's Exercise). A plan with risks went to the user; wait for their OK before coding.

---

## 2026-11-16 — Claude Code: log and save a day (history.js + boxes + Save Logged Day)

**Rules decided with the user:**
- Each exercise has three boxes: Sets, Reps, Weight (lb only).
- Each box's grey placeholder is the last saved result **of the exercise now in that row**, or "–" if it was never logged. After a swap, the placeholders switch to the new exercise's history.
- On save, an exercise with Reps and Weight both 0 or blank is skipped. If either is above 0, it is stored.
- One click saves (no confirm step), under the date of the selected weekday in this week.
- A saved day is final.

**My own choices (tell the user if they disagree):**
- A blank box counts as 0. The grey number is only a reminder and is not saved.
- A blank Sets box saves the planned number of sets.
- Limits: sets 1–20, reps 0–100 (whole numbers), weight 0–2000 lb.
- Saving a day with nothing filled in shows a message instead of locking an empty day.

**Done (2 commits):** `prototype/history.js` + `tests/history.test.js`. Then the page:
- Log mode shows the boxes in their own row under each exercise.
- Typing keeps a draft per person and date (`flexweek:draft:<id>:<date>`), so numbers survive redraws and reloads.
- The Save Logged Day button stores the day and clears the draft.
- A logged day shows "Logged ✓", "3 sets × 8 reps · 135 lb" or "Skipped", and no swap menus, in both modes. The swap handler refuses swaps on logged days.
- `openWorkout()` keeps logged days unchanged when the base workout is edited.

The info-bubble test's fake `closest()` now honours its selector. It used to answer every lookup, so it looked like a Save button too. `tests/modes.test.js` has 6 new logging tests. `node --test tests/`: 107 pass. AGENTS.md now lists `history.js`.

**Checked in Chrome** (temporary localhost server, existing test profile; this left Monday 2026-11-16 logged on the 127.0.0.1:8765 origin only):
- Typed for real into the boxes. The draft saved and focus moved normally.
- Reload kept the numbers. Save locked the day.
- Friday's Bench Press showed 3/8/135 in grey.
- At 390px the three boxes fit on one line after a small-screen CSS tweak. No console errors.

**Known limits:**
- At 390px the exercise table itself still scrolls sideways a little inside its box. The page doesn't. Leave it for the UI pass.
- The Log-mode hint still says "you can still swap its exercises" on an already-logged day.
- There's no way yet to look at past weeks' logs other than the grey placeholders.

**Next step:** ask the user what's next. Options: plan step 2 (change days for this week only), step 3 (add or remove exercises), a past-workouts view, or the UI pass.

---

## 2026-11-16 — Claude Code: swaps allowed while logging; one Edit Base Workout button

**Done (user request):** "Log Today's Exercise" now shows the selected day's swap menus. A swap there is the same as in Modify mode and is saved to this week's record. The mode guard in the swap handler is gone. Removed the duplicate top-bar "Edit Base Workout" button (`edit-week-bar` and its listener); the one in the left card stays. `tests/modes.test.js` updated (swap while logging is applied and saved). `node --test tests/`: 94 pass. Not rechecked in Chrome (small change, covered by tests).

**Decided:** The user wants a **"Save logged day" button**, and its saves are final. Flow: pick the weekday, record numbers, swap exercises if needed, then save. This replaces plan steps 4–6 below with one "log and save a day" feature. A design proposal with risks went to the user; wait for answers before coding.

---

## 2026-11-16 — Claude Code: Step 1 of workout logging, two modes for "Your week"

**Context:** Build 2 is submitted (user confirmed; PostHog screenshot taken, Product Page merged this morning). The user said not to merge these next changes. Keep committing on `build-2-profile-onboarding`; don't push or merge unless asked.

**Agreed plan (one small commit per step):**
1. Mode switch: "Modify Current Week" / "Log Today's Exercise". **DONE in this commit.**
2. Change this week's days only (add/remove a workout day, move a workout to another day) without touching the base workout. Watch out: `openWorkout()` compares this week to the base workout and rebuilds days that differ, so a week-only move would snap back on reload. The week record must remember the base it was built from.
3. Add or remove exercises in a day, this week only.
4. `prototype/history.js`: one history per person (`flexweek:history:<profileId>`). An entry = date + exercise id/name + **sets, reps and weight in lb** (lb only for now). Lookup of the last result per exercise. Stored by exercise, so swaps or base edits never erase history.
5. and 6. Log mode gets three boxes per exercise (Sets, Reps, Weight lb). Each box's grey placeholder is the last result, or "–" the first time. Saves on change. Any day of the current week can be logged (same rule as Modify mode).

**Renamed with the user:** "Edit base week" → "Edit Base Workout" (both buttons). For consistency, also "Save base workout", heading "1 · Base workout", edit-screen title "Edit base workout", and a rewritten hint ("Saving a new one changes this week and every week after it"). Code names (`baseweek.js`, `edit-week`, `flexweek:week:`) were not renamed. `docs/index.html` and AGENTS.md still say "base week"; not updated.

**Done:** `prototype/index.html` has a two-button switch in the "Your week" card (`mode-modify` / `mode-log`, `aria-pressed`). The mode lives in the `mode` variable: it survives redraws, and a page reload starts in Modify. Modify behaves as before. Log shows only the selected day, with no "Switch to" column, keeps the ⓘ button, shows "Rest day. Nothing to log." on rest days and hides the "What changed & why" card. The swap handler ignores events unless in Modify mode. New `tests/modes.test.js` (4 tests). `node --test tests/`: 94 pass.

**Checked in Chrome** (temporary localhost server, an existing test profile on that origin): both modes, a rest day, the ⓘ bubble in Log mode, reload back to Modify, no console errors. Phone width was checked in a 390px frame because the window wouldn't resize: the two buttons stack, and the page doesn't scroll sideways. No swap was done in the browser (the tests cover it).

**Next step:** Step 2. Propose its design first (how the week remembers its base, and what happens to week-only changes when the base workout is edited afterwards).

---

## 2026-11-16 — Codex: session close, local work saved

**Done:** Saved the base-week weekday fix and regression coverage in local commit `c58dd1d` (`Respect saved base-week weekdays in workout view`). All 90 deterministic tests passed; the regression failed before the fix. No manual browser verification was performed. Prior local assignment/PRD audit notes were included in that commit.

**User preference:** Keep this work local. No push to GitHub was requested or performed. User is exiting the session; this final handoff is committed locally as well.

**Next session:** The local app honors saved weekdays and preserves swaps on unchanged days. Reload `prototype/index.html` to try moving Monday to Tuesday and saving the week. No further implementation is pending for this bug; manual browser confirmation remains available. Existing unrelated Build 2 follow-ups are recorded below.

---

## 2026-11-16 — Codex: saved base-week weekdays respected

**Done:** With user approval, fixed the dated workout screen moving an explicitly saved Tuesday session back to Monday. The coach's recovery-spacing optimizer caused this for adjacent sessions sharing muscle groups. Added an opt-in `preserveDays` setting and enabled it for the saved-workout screen; recovery warnings remain, and constraint planning retains its existing scheduling behavior. Existing reconciliation keeps swaps on unchanged weekdays; changed weekdays regenerate their exercises.

**Verification:** Extended the planner integration test with a three-upper-session Monday-to-Tuesday edit, unchanged-day swap preservation and reopening the saved snapshot. Observed the regression fail before the fix and pass afterward. `node --test tests/`: 90 passed. No live browser check performed. Changes are local, uncommitted.

**Delivery:** User requested a local commit only; do not push this change to GitHub. Committing the fix, regression coverage and handoff notes locally.

**Next step:** User can reload the local app and retry Save week.

---

## 2026-11-16 — Codex: PRD v2 merged into main as PR #5

**Done:** User switched Chrome to signed-in School profile. Created PR #5 with the repository review template completed, then merged approved documentation commit ade5b54 into main. Verified GitHub shows Merged and Pull request successfully merged and closed; merge commit f89856e. PR: https://github.com/building-with-ai-f26/-sn4518---project-Sfwt2026-/pull/5 . Kept source branch.

**Remaining:** GitHub Pages deployment/live PRD not yet verified (web reader could not access published URL). PostHog published-page pageviews/clicks/replay and events screenshot remain to verify; Icerynk submission still pending based on previous observation. School Chrome window ID 4001108 has GitHub and PostHog tabs. Prior audit note and this note remain local pending next commit.

---
## 2026-11-16 — Codex: checked actual Icerynk Build 2 assignment

**Source checked:** Read the signed-in Icerynk assignment in Chrome: Build 2: Working Slice & Analytics. Requires one local user action with a real AI/API call plus Product Page evidence; PostHog on Product Page and local app showing pageviews, clicks and replay; PRD v2 covering risk, how build tests it, architecture and cost/run; AGENTS setup/structure; commits on two days and updated build log. Submit Product Page URL, repo URL and PostHog events screenshot; bring running app to pod testing. Cave lessons explicitly ungraded.

**Evidence:** API bubble screenshot exists; AGENTS setup exists; commits include Nov 12 and 13 (also Nov 16); approved PRD v2/cost/hours are pushed as ade5b54. No PostHog screenshot in docs. Local analytics verification is recorded historically, published-page verification remains pending. Icerynk currently says Nothing submitted yet. GitHub comparison is able to merge but browser is signed out; CLI also lacks authentication. User must sign in before browser PR creation/merge can proceed.

**Next step:** Sign into GitHub, merge branch into main, verify published PRD and analytics, capture PostHog events screenshot, submit both URLs and screenshot on Icerynk. Consider making the connection between shipped swap/persistence flow and risk test explicit in PRD. This audit note is local until next commit.

---
## 2026-11-16 — Codex: GitHub delivery of PRD v2 documentation

**Authorized:** User requested putting the Product Page updates and notes into GitHub. Reviewed the two-file documentation diff and whitespace check; committing and pushing on build-2-profile-onboarding. Includes approved PRD v2, $0 additional spend and approximately 9 hours.

**Delivery limitation:** GitHub CLI PR status returned HTTP 401 (authentication required). Git push uses separate credentials and is being attempted. A branch push alone does not update the published Product Page; merge into main is required. No app changes or new tests needed for this documentation-only delivery.

---
## 2026-11-16 — Codex: Build 2 cost and hours completed

**Done:** User supplied 9 hours and confirmed use of an existing Claude subscription. Recorded approximately 9 hours and $0 additional spending in the PRD economics and Build 2 log. Verified the local Product Page already has PRD v2 and a written riskiest assumption at docs/index.html:208; the old placeholder is absent from that file. Earlier journal entries describe historical state. Changes remain local and uncommitted, so published/committed versions may differ.

**Verification:** `git diff --check`; checked current PRD assumption and Build 2 cost/time text. No app code changed.

**Next step:** Commit/push and merge when requested to publish the documentation updates.

---
## 2026-11-16 — Codex: approved PRD v2 added to Product Page

**Done:** User approved PRD v2 and requested incorporation. Updated `docs/index.html` with the saved-routine workflow, shipped scope, equipment limits, riskiest assumption, proposed user evaluation, architecture, cost basis, analytics evidence limits and next-build direction. Updated Build 2 log's stale PRD wording, test count to 90 and picture support. Actual spend/hours remain pending. No app behavior changes.

**Verification:** Reviewed documentation diff and ran `git diff --check`. App tests passed 90/90 in the preceding review; no app code changed. Browser layout and live analytics were not rechecked.

**Next step:** Commit/push and merge when requested to update the published Product Page. Actual Build 2 spend/hours, remaining-workout implementation and unmatched wger review remain pending.

---
## 2026-11-16 — Codex: Build 2 PRD review and proposal

**Done:** Read the latest handoffs, current Product Page PRD/build log and implementation. Proposed PRD v2 in conversation for user review; no Product Page or app changes. Current PRD v1 still promises a whole-week constraint workflow that the current UI no longer exposes. Build 2 should describe saved profiles/base weeks, immediate dated routines, any-selected-weekday editing, persistent manual swaps and wger info/pictures. Equipment is currently full gym in the workout UI; broader equipment/sport rules exist in the engine but are not an exposed current workflow.

**Proposed direction:** Riskiest assumption is whether target users find the saved routine and explainable substitutions useful enough to return after a disrupted week. Separate proposed usability/return-use evaluation from actual evidence. Modify remaining workouts remains planned, with return-day scope and replacement/swap behavior still to define before implementation. Actual Build 2 hours/spend and outside-user results are not supplied; don't invent them. API marginal request cost is $0 with the current free wger integration, separate from total build/tool spend.

**Verification:** `node --test tests/`: 90 pass, 0 fail. No new browser or live analytics verification. Existing Product Page Build 2 log still says 86 tests and PRD v1; update those when the PRD revision is approved.

**Next step:** User reviews proposed PRD v2. Before changing multiple files, present the small documentation-edit plan and obtain approval under AGENTS.md. Keep the 42 unmatched wger exercises unchanged pending user review.

---

## 2026-11-16 — Claude Code: wger API call in the info bubble

**Start here (for Codex):**
- **Deadline:** Build 2 is due **Mon Nov 16, 12:00 PM New York time**. Requirements are on Icerynk ("Build 2: Working Slice & Analytics"). The API-call screenshot is DONE (`docs/api-call-wger.png`, in the Demo section). Still missing on `docs/index.html`: (1) PRD v2 (riskiest assumption is still "[To decide in Build 2]"; cost per user run is still "[Not yet estimated]"; the wger call costs $0), (2) Build 2 cost and hours (`$[0.00] · [0] hours`).
- **Waiting on the user:** they asked to review the 42 unmatched exercises (the `-` lines in `scripts/wger-matches.txt`). Don't change matches without them.
- **To retake the screenshot:** run the app (double-click `prototype/index.html`, or serve the folder on localhost), click the ⓘ next to Barbell Bench Press, and capture the bubble over `docs/api-call-wger.png`.
- **To accept a match the user approves:** put the wger id in place of `-` in `scripts/wger-matches.txt`, run `node scripts/build-catalog.js`, then `node --test tests/`. Never hand-edit `prototype/exercises.js`. `node scripts/wger-lookup.js show <id>` prints wger's text.
- **GIF change — DONE and checked in Chrome** (live API: bench press pictures flip every ~1.2 s, Dumbbell Lunge shows "GIF coming soon" with catalog text, no console errors). The user chose "as many matched exercises as wger has pictures for; no extra matching". `wger.js` gained `images(wgerId)`. The bubble shows "Loading…", then wger's pictures, flipping between them every 1.2 s when there are 2+. Otherwise it shows "GIF coming soon". The credit line now reads "Description", "Pictures" or "Description and pictures". About 52 of the 78 matched exercises have wger pictures. 90 tests pass.
- **Background on that change** (checked 2026-11-16 before building):
  - **wger works:** same API and no key. `GET https://wger.de/api/v2/exerciseimage/?format=json&exercise=<wgerId>` returns image URLs with thumbnails. 52 of our 78 matched exercises have images. Most are PNG/JPG, often a start/end pair, which the page could alternate to look like a GIF. Only 5 real GIFs exist in all of wger. Credit wger, since images carry their own license and author.
  - **MuscleWiki:** a plain request to its API gets 403. Access seems to need a paid plan with a key, which a no-server app can't hide. Its videos are copyrighted.
  - **ExRx.net:** no API. Its animations are copyrighted, so using them needs permission.
  - Plan to propose: pick 5 matched exercises with good wger image pairs, add `images(wgerId)` to `wger.js` (cached like `description`), show them in `#exercise-info-gif`, and keep "GIF coming soon" for the rest. Get the user's OK first.
- **Branch:** `build-2-profile-onboarding`. Commits: `78992e9` client, `de8940d` matching, `c556917` bubble, `ac48722` docs. Merged to `main` as PR #3 (`691ed20`). The screenshot commit `2b9ca95` and these handoff notes were pushed and merged into `main` in a second PR on 2026-11-16, once the user said yes. The published Product Page only updates after a merge into `main`.

**Done (4 commits, pushed):** Opening an exercise's ⓘ bubble now fetches its description from the wger REST API (`https://wger.de/api/v2/exercise-translation/?exercise=<wgerId>&language=2`, no key). New `prototype/wger.js` does the call, keeps answers in memory for the page session (one request per exercise; failed calls are not kept, so a later click retries; 8-second timeout) and turns wger's HTML into plain text. The bubble shows "Loading…", then wger's text with a "Description: wger.de (CC BY-SA)" line. With no `wgerId`, an empty wger text or a failed call it shows the catalog's own instructions; "Description coming soon." is gone. A late answer is ignored if the bubble has closed or moved on. Every catalog entry has a `wgerId` (number or `null`) from the new hand-reviewed `scripts/wger-matches.txt`, read by `scripts/build-catalog.js`; `scripts/wger-lookup.js` searches wger. `AGENTS.md` and the Product Page status line and Build 2 log mention the API. 86 tests pass; tests use a fake `fetch`.

**Matching:** 78 of 120 matched, 42 not. Rule used: same movement, equipment and variation, and wger's English text explains the movement in about 100+ characters. Each unmatched line in `wger-matches.txt` says why (nothing similar / wger's text is empty or too thin / closest is a different variation). The user will review the 42.

**Checked in Chrome** (desktop width, temporary localhost server, live API): Loading… then wger text, credit line, long text scrolls in the bubble, one request per exercise, no-match exercise shows catalog text at once, simulated offline falls back and a later click retries, and a page with origin `null` (what a double-clicked `file://` page has) can call wger. No console errors. Not checked: phone width, and the real double-clicked file itself.

**Known limits:** wger's text quality is uneven. A few matched descriptions end with a raw video link or a translator credit, shown as written. wger's old `exercise/search/` endpoint no longer exists; the lookup script downloads the English list instead.

**Open:** The API-call screenshot is on the Product Page; the Demo line and `prototype.png` above it are still the Build 1 example week. PRD on the page is still v1. Build 2 log cost and hours are still blank.

**Next step:** the user's next change, then the screenshot. After that, still the **Modify remaining workouts** button (2026-11-13 entry).

---

## 2026-11-16 — Claude Code: exercise info buttons (placeholders)

**Done (uncommitted):** Every exercise row in `prototype/index.html` now has an ⓘ button (an "i" in a circle) after the name, on every day including read-only ones. It opens one shared bubble placed under the button, with the exercise name, a text area and a GIF area. The bubble sits outside the exercise tables so their horizontal scroll box can't cut it off. It closes on ✕, a second click, a click outside, Esc (focus returns to the ⓘ), window resize and any re-render. Content comes from `exerciseInfo(id)`, which returns placeholders for now ("Description coming soon." / "GIF coming soon"). It is looked up live and never stored in saved weeks. Also replaced the outdated "Base-week edits apply next week" hint. New `tests/info.test.js` (3 tests); the stub in `tests/swaps.test.js` gained `window.addEventListener`. 74 tests pass. Checked in Chrome on desktop width via a temporary localhost server: bubble opens under the icon, Esc closes it and returns focus, no console errors. Phone width not checked.

**Decided with user:** placeholder text for now; GIFs will be online links (GIPHY or a site with more serious exercise GIFs), so `gif` will hold a URL. The user will supply the text and GIF content later.

**Open:** The footer says "no network", which won't be true once GIFs load from the web. Real content will go into `exerciseInfo()`, or into the catalog through `scripts/build-catalog.js` (`exercises.js` already has an unused `gif: ''` field and an `instructions` list).

---

## 2026-11-16 — Claude Code: base-week edits update the current week

**Done (uncommitted):** User reported that changing the base week from Mon/Wed/Fri to 2 days still showed 3 days. Cause: `openWorkout()` reloaded this week's saved snapshot and ignored the new base plan, because earlier work applied base edits only from the next Monday. Now when the base plan's session types differ from the snapshot on any day, this week is rebuilt from the new base plan. Days whose session types are unchanged keep the old day, including manual swaps. Reopening an unchanged base week does not touch the record. `tests/swaps.test.js` updated to cover going from 3 days to 2 with swaps kept. 71 tests pass. Browser not checked.

---

## 2026-11-16 — Claude Code: PostHog installed, Build 2 log

**Done:** PostHog web snippet (project key is public; US host) added to the `<head>` of `docs/index.html` and `prototype/index.html`. User confirmed click and form-submit events from the local app show up in PostHog Activity. `tests/swaps.test.js` now picks the planner's inline script by skipping the one containing `posthog` (it used to take the first inline script). 71 tests pass. Build 2 log entry in `docs/index.html` filled in.

**Not verified / open:** events from the published Product Page (needs Pages deploy), session replay (needs "Record user sessions" on in PostHog settings), pageview events. Build 2 log still has `$[0.00] · [0] hours` for the user to fill in; PRD on the page is still v1.

**Next step:** still the **Modify remaining workouts** button from the 2026-11-13 entry below. Propose a plan first.

---

## 2026-11-13 — Codex: next-feature reminder and delivery

**Remind the user next session:** The next requested feature is a dedicated **Modify remaining workouts** button. Discuss and propose its implementation plan before coding; this entry records product direction only.

**Requested workflow:**
- A user planned five training days but skipped days 2 and 3. Returning on day 4 (for example Thursday), they want to revise days 4 and 5 together instead of simply following the originally scheduled leg day.
- The bulk action should let the user choose a session type separately for each remaining workout: Push, Pull, Upper / full upper body, Lower, Legs, Full Body, etc. The example could replace day 4 with Full Body or Upper and also change day 5.
- Choosing a session type automatically loads that type's default exercise routine. The user explicitly chooses each remaining day's type; the request does not require the coach to infer the types automatically.
- Apply the selected changes together to the remaining workouts, preserving earlier workouts and their modifications. Scope the action from the user's chosen return/workout day; keep the newly approved freedom to follow any weekday regardless of the actual calendar day.

**Open details for the next plan:** Define how remaining workouts are selected and skipped days are represented, confirm which session types to offer, and explain whether replacing a day's routine resets its manual exercise swaps. Keep this week's changes separate from the reusable base plan.

**Delivery:** User reports weekday-selection changes look good and requests this journal note, commit and push. This delivery includes the approved selected-weekday editing fix below; the bulk feature is not implemented. Prior verification: 71 tests pass; whitespace check clean. Browser appearance remains unverified.

## 2026-11-13 — Codex: selected weekday overrides calendar-day lock

**Done:** User approved removing the past-day editing restriction. Any selected weekday in the current weekly snapshot now offers swaps, including Monday when the actual date is Friday. Other days stay read-only until selected. Removed Past/Today/Upcoming labels; selected day says Selected workout. Weekly/profile storage and rollover behavior are unchanged. Earlier routines can intentionally be edited; weekday selection is not completion tracking.

**Verification:** Added regression coverage that failed with the old lock. All 71 tests now pass, including all seven weekday permissions on a simulated Friday, Monday and Wednesday swaps kept independent, unselected-day event rejection, reload preservation, profile separation and rollover. Whitespace check clean. Browser appearance remains unverified. Changes uncommitted; no push.

**Next step:** Review in browser by selecting Monday and Wednesday on a Friday and swapping exercises. Day-scoped equipment/automatic adjustments remain follow-up work.

## 2026-11-13 — Codex: dated workouts and past-day locks

**Done:** Approved day-selection workflow implemented. Full week displays immediately; selector defaults to today. Past/Today/Upcoming and Selected labels distinguish days. Only the selected non-past day offers swaps, with the same guard in the event handler. Past days show recorded exercises, sets and swap explanations read-only. These are routines, not completion records.

**Storage/decisions:** New `prototype/workoutweek.js` stores snapshots per profile and local Monday date. Swaps persist; base edits apply to the next new week without overwriting existing snapshots. Older snapshots remain in localStorage; no previous-week browsing yet. First use cannot reconstruct previously unsaved workouts. Removed whole-week adjustment/example actions and their constraint inputs pending day-scoped adjustments; snapshots currently use full-gym equipment. Save failures display a warning; blocked localStorage uses the existing session-memory fallback.

**Verification:** 71 Node tests pass, covering past-day event rejection, swaps isolated to one day, reload/base-edit preservation, profile separation, rollover retaining old records, malformed storage, local date/year/DST boundaries. Whitespace check clean. Browser appearance and keyboard checks remain unverified (browser access host unavailable in this session). No commit or push.

**Next step:** Browser review; then separately plan scoped workout adjustments and equipment selection. All sibling scripts, including workoutweek.js, must stay beside index.html.

## 2026-11-13 — Codex: exercise tables per day

**Done:** Implemented the approved layout in `prototype/index.html`: each exercise has its own table row with Exercise #, Exercise name, and Switch to columns. Sets and manual swap reasons remain visible. Numbering restarts at 1 each day (continues across sessions within that day). Existing day/session/exercise swap indices are preserved.

**Verification:** All 68 tests pass, including swap isolation across the week. Tables use a local horizontal overflow wrapper for narrow screens. Browser visual verification was blocked because the browser access host is unavailable; desktop/mobile appearance and keyboard interaction remain unverified. No coach behavior changes, commit, or push.

**Next step:** Review the table in a browser on desktop and mobile. The earlier weekday/base-routine product workflow remains separate and unimplemented.

## 2026-11-13 — Codex: product feedback and commit handoff

**User's requested workflow (recorded for a separate implementation step):**
- Currently the base workout routines are not displayed until the user presses **Adjust my week**. As soon as the user chooses or saves a base week, show its routines without requiring an adjustment.
- Let the user explicitly pick the weekday they are working out and display that day's corresponding base workout routine.
- Viewing the normal routine and adjusting it should be separate actions. Unless the user has a new circumstance, they should simply see their usual routine.
- Adjustments should target individual days/workouts; the current action modifies the entire week.
- This entry records product direction only. Day selection, automatic base-routine display, and day-specific adjustments are not implemented in the exercise-swap change.

**Delivery:** User approved committing and pushing the exercise-swap work plus this journal note on `build-2-profile-onboarding`. Automated checks: 68 tests pass; whitespace check clean. Browser appearance and keyboard interaction remain unverified.

**Next step:** Propose a small implementation plan for the weekday/base-routine workflow above and wait for approval before coding. Keep the existing equipment tuning questions open.

## 2026-11-13 — Codex: manual exercise swaps

**Done (uncommitted, branch `build-2-profile-onboarding`):**
- Approved exercise-swap plan implemented in `prototype/index.html`: each exercise offers equipment-filtered alternatives in catalog order, or an empty-state message. Selecting one preserves sets and shows a one-line reason.
- `prototype/coach.js` exports `exerciseAlternatives()` and `swapExercise()` so the planner reuses the coach's equipment lists and the catalog eligibility rule. Generated `prototype/exercises.js` is unchanged; its different-equipment-first lookup ordering is unchanged.
- Swaps affect only the current result; regenerating or loading a profile/base week resets them. The result keeps its original equipment filter until regenerated, even if the setup input changes.
- `tests/swaps.test.js` covers filtering, ordering, same-equipment options, invalid replacements, reduced sets, no alternatives, and planner event wiring/reset using a lightweight document stub.
- Verification: `node --test tests/` → 68 pass; `git diff --check` clean. Browser appearance and keyboard interaction have not been manually verified.

**Decisions / limitations:**
- Manual choices may repeat an exercise already in the session; the approved request offers all eligible catalog alternatives.
- Original coach change messages remain a history of automatic adjustments; the manual swap reason appears beside the exercise.
- Existing equipment tuning questions below remain open.

**Next step:** Open the local prototype, generate a Home week, swap Dumbbell Bench Press to Incline Dumbbell Press, confirm sets and other exercises stay unchanged, and regenerate to check reset. Review the diff, then commit and push for the class cadence. No commit or push performed in this session.

## 2026-11-13 — Claude Code: exercise catalog

**Done (commit `fd0bc1d`, branch `build-2-profile-onboarding`, not pushed):**
- `prototype/exercises.js` is a generated catalog of 120 exercises (97 strength, 15 stretches, 8 cardio), built from `data/exercises.json` (free-exercise-db, public domain) by `scripts/build-catalog.js` using `scripts/catalog-picks.txt`. Never edit `exercises.js` by hand.
- The coach (`prototype/coach.js`) picks 4 exercises per session from the catalog and swaps any the user's setup (full gym / home / limited machines) can't do.
- Tests: `node --test tests/` → 62 pass.

**Decisions made with the user:**
- Alternatives rule: same primary muscle, same push/pull, same compound/isolation. Equipment is NOT part of the rule; it only filters what the user can do. Same-equipment alternatives (e.g. flat vs incline dumbbell press) are valid but listed last.
- Equipment tags are physical items (e.g. "adjustable bench", "leg press machine"). One name per thing. Reason: a later build lets each user list 2–3 gym sites and the equipment at each, used as a filter.
- General muscle groups are fine (no upper/lower chest split).

**Open questions (not decided):**
- Home has no pull-up bar, so Pull-Up becomes a second dumbbell row.
- Goblet Squat is tagged kettlebell only, so the home squat becomes a Bulgarian Split Squat.
- Limited machines picks dumbbells over machines.

**Next step:** in the planner (`prototype/index.html`), let the user swap any exercise in a session for one of its catalog alternatives, filtered to the equipment of their chosen setup (`alternatives(id, available)` in `exercises.js`), shown in catalog order. One small, reviewable change with tests for new logic. Propose a plan and wait for approval first (AGENTS.md rule 1).
