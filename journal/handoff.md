# Agent handoff log

Shared notes so work can move between Claude Code and Codex. Newest entry on top.
Agents: read the latest entry before starting, and add a new one before you stop.

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
