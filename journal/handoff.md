# Agent handoff log

Shared notes so work can move between Claude Code and Codex. Newest entry on top.
Agents: read the latest entry before starting, and add a new one before you stop.

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
- **Branch:** `build-2-profile-onboarding`, ahead of origin by the unpushed commits below. Commits: `78992e9` client, `de8940d` matching, `c556917` bubble, `ac48722` docs. Merged to `main` as PR #3 (`691ed20`). **The screenshot commit `2b9ca95` and this note are committed locally but NOT pushed or merged**: the user hasn't said yes yet. Ask, then push and merge into `main` with a merge commit, as for PR #3. The published Product Page only updates after a merge.

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
