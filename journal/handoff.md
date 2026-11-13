# Agent handoff log

Shared notes so work can move between Claude Code and Codex. Newest entry on top.
Agents: read the latest entry before starting, and add a new one before you stop.

---

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
