# Security audit

## My kind of app

Build 3 beginner lane. FlexWeek is a static HTML, CSS, and JavaScript app served by GitHub Pages. Profiles, base weeks, workouts, and history are stored in browser localStorage. There is no server, shared database, account sign-in, hosted private file storage, or AI endpoint. Database row-level security, expiring private file links, database backups, and AI route rate limits and spending caps are inapplicable to this build.

## What I checked

- The app uses PostHog for analytics and the public wger exercise API for exercise descriptions and images. Neither service needs a private key in the app.
- The project has no application package dependencies to scan with npm audit or pip-audit. The app loads the PostHog SDK in the browser.
- All 117 automated tests passed before deployment. The builder completed a local fake-profile walkthrough and confirmed that the live app worked on his phone.

## What I found

- The app inherited a PostHog setup used for Session Replay in Build 2. A workout page can display profile details and exercise logs.
- Local profiles are scoped to the browser’s storage. People sharing a browser profile can access the local FlexWeek profiles and history in that browser.

## What I fixed

- The app configuration disables PostHog Session Replay and autocapture and explicitly enables pageview tracking.

## What is left

- Search the live HTML and JavaScript for private credentials, including the prefix examples in the class slides, and capture a screenshot of the result. The PostHog project token is public by design.
- Use a fresh fake-profile session to verify the deployed analytics settings and inspect the event details for profile or workout data.
- Complete the classmate phone walkthrough. Record results and any fixes here or in the Build 3 log as appropriate.
