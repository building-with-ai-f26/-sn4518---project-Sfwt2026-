# Build 3: Go Live & Security Audit

Optional working notes. Publish your required build log on `docs/index.html`; no separate journal submission is required.

**Build due:** Monday, Nov 23, 2026 at 12:00 PM (Noon)

---

## 1. What you made
- **Lane:** Beginner.
- **Deployment commit:** `d9a62a1` on `build-3-pages`. GitHub pull request number and merge SHA still to be recorded.
- **Links:** [Live app](https://building-with-ai-f26.github.io/-sn4518---project-Sfwt2026-/app/) · [Product page and PRD](https://building-with-ai-f26.github.io/-sn4518---project-Sfwt2026-/) · [Security audit](../SECURITY.md).
- **Summary:** GitHub Pages now serves the existing workout app. The builder completed a local fake-profile walkthrough and used the deployed app successfully on his phone. All 117 tests passed.

## 2. Metacognition ("Learn with AI"): Branches, Diffs & Agent Guardrails
- **What I learned:** GitHub Pages serves the files under `docs/`. Moving the app to `docs/app/` makes it available at `/app/` after deployment. Future feature and design changes can be published at the same address.
- **Shipping instructions:** `AGENTS.md` now covers tests, branch and PR, merge, and live phone verification.

## 3. What the agent did
- **Agent:** Codex.
- **Direction:** Follow the static GitHub Pages path from the class slides and keep the deployment focused. Preserve pageview analytics and disable automatic interaction tracking on the app. Codex first disabled Session Replay too; it was turned back on with full text and input masking because the assignment requires replay on the live site.
- **Builder verification:** Ran the fake-profile workflow locally, handled the PR in GitHub, and used the live app on a phone.

## 4. What didn't work
- **Shipping issue:** GitHub CLI returned HTTP 401 when creating the PR. The branch push succeeded and the builder opened the PR through GitHub.
- **Pending evidence:** Live private-key check and screenshot, PostHog test with fake data, and the classmate’s full phone walkthrough.

## 5. What it cost
- **Agent spend, hours, and cumulative spend:** Pending actuals.
- **Hosting and runtime:** GitHub Pages and the public wger API. No paid AI runtime.

## 6. Pod Critique Sign-off
- **Classmate phone walkthrough and feedback:** Pending.
