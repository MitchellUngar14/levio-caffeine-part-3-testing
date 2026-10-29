---
name: demo-part
description: Build and verify the next part of the Claude Code demo (caffeine tracker), in its own folder, through to a passing test run, commit and tag
---

The demo has four parts, each a git tag: `part-1-architecture` (in the sibling
repo `../caffeine-tracker`, frozen), then `part-2-app`, `part-3-tests` and
`part-4-prod` in the build repos. Each build part lives in its own folder,
cloned from the previous one, so every part can be shown on its own.

1. Find the next part: `git tag` in this repo shows the parts done so far. The
   runbook is `../caffeine-tracker/docs/DEMO-RUNBOOK.md`: read the section for
   the next part for its prompts and "things to show". Read `CLAUDE.md` and
   `docs/ARCHITECTURE.md` here before changing anything structural.
2. Start the part in a new sibling folder named for it (for example
   `../caffeine-tracker-prod` for Part 4): `git clone` this repo there, so the
   history and tags carry over, then `npm install` and
   `npx playwright install chromium`. Work there from then on; leave this folder alone.
3. Do the part's work. Keep files small and well named; TypeScript throughout;
   rules in `packages/core` with tests; screens and flows get a Playwright test
   in `e2e/`. Record any design change in `docs/ARCHITECTURE.md` under
   "Changes since Part 1".
4. Verify: `npm run typecheck`, `npm run test:all` (Vitest and Playwright), and
   `npm run build`. Fix until everything passes. Then open the app in the
   browser pane and check the part's "things to show" by eye.
5. Update `README.md` and `docs/` for the part, commit with the message
   `Part N: <summary>` (with the usual co-author line), and tag it
   `part-N-<name>`. Report the test count, files changed and anything left
   undone or unverified.
