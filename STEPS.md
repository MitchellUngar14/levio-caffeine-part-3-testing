# Part 3: Testing — what was done

The goal: give the app a test suite at three levels, with a way to run and
watch the tests from inside Claude Code. This folder is a clone of Part 2 (so
the history and tags carry over) with the tests added on top.

## Steps

1. **Cloned the Part 2 repo into this folder**, installed dependencies, and
   added Playwright with Chromium.
2. **Chose Playwright over Cypress:** the architecture already named it, it
   runs headless in CI, and its fake clock lets a "three hours without
   caffeine" reminder be tested in milliseconds.
3. **Wrote the Playwright setup:** a config that starts its own Vite server,
   and fixtures that freeze the clock on a Thursday morning in Toronto and
   replace the browser's notification API with a stub that records calls.
4. **Wrote 28 end-to-end tests** across logging drinks, the coffee cup's states,
   the history drawer, the calendar colour levels, settings and validation,
   theme, export, persistence, and reminders (gap mode, set times, cut-off,
   demo mode, waking after sleep). The first run had six failures, all in the
   tests' own selectors, fixed in one pass.
5. **Added unit tests** for the time zone helpers (both daylight-saving
   changes), the coffee cup's rendered states and the format helpers.
   94 tests in all, passing.
6. **Wrote `docs/TESTING.md`:** the three layers, how the fake clock works, the
   store contract, failure artifacts, and a recipe for planting a bug on stage
   so the audience can watch the tests catch it (verified: one test fails with
   "expected past-cutoff, received due").
7. **Committed and tagged** `part-3-tests`.
8. **Built a Playwright pane for Claude Code** (the `pw-runner` mod, now an
   installed plugin): lists the tests, runs all, one file or one test with live
   results, opens UI mode or the HTML report in Claude's browser, shows the
   screenshot, video and trace of a failure, and gives Claude a `run_tests`
   tool. Along the way: Playwright keeps a video of failed tests.
9. **Built a second mod, `help-mod`:** a pane listing every command the mods
   add, searchable and collapsible, click to run. Both mods live in
   `~/claude-mods` as a local marketplace and load in every session.
10. **Added project tooling:** a hook that typechecks the edited workspace after
    every Edit or Write, and a `/demo-part` skill that builds the next part
    in its own folder through to passing tests, commit and tag.

## Outputs

- `npm run test:all`: 66 unit tests and 28 Playwright tests, all passing
- `docs/TESTING.md`, `.claude/hooks/typecheck.sh`, `.claude/skills/demo-part`
- `/pw` and `/help-mod` in any session (from `~/claude-mods`)
- Tag `part-3-tests`, plus a tooling commit on top

## Worth showing live

- Plant the bug from TESTING.md, run the tests, and let Claude find and fix it.
- Press `run all` in the Playwright pane and watch the dots turn green.
- A failed test's `[screenshot]` and `[trace + report]` links.
