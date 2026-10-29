# Testing

Three layers, cheapest first. All of them run with `npm run test:all`.

| Layer | Tool | Where | What it covers | Runs in |
|---|---|---|---|---|
| Unit | Vitest | `packages/core/src/*.test.ts` | The reminder rules, time zone maths, drink search and the drink list's sources. Pure functions with `now` passed in, so every edge case is one line. | ~1 s |
| Unit, web | Vitest + jsdom | `apps/web/src/**/*.test.ts(x)` | The coffee cup's states (rendered to HTML), format helpers, and the `LocalStorageStore` contract. | ~2 s |
| End to end | Playwright | `e2e/*.spec.ts` | Real Chromium driving the real app: logging drinks, the cup, the drawer, the calendar, settings, export, persistence, and reminders firing. | ~20 s |

## Commands

```bash
npm test                  # unit tests (core + web)
npm run test:e2e          # Playwright, headless
npm run test:e2e:ui       # Playwright's UI mode: watch, step through, time travel
npm run test:all          # everything
npx playwright show-report   # after a failing run
```

Playwright starts its own Vite server on port 5174 (or reuses one that's already there).

## How the end-to-end tests control time

Reminders fire after hours, so the tests never wait. Each test runs in
`America/Toronto` with a frozen clock (`page.clock.install`), starting on
Thursday 2026-10-29 at 10:00 unless it says otherwise. `app.tick("02:00:00")`
advances the clock and runs any timers that come due, so "three hours without
caffeine" takes milliseconds. `clock.setFixedTime` jumps without running timers,
which is how the "laptop went to sleep" test works.

`window.Notification` is replaced by a stub that records calls (`stubNotifications`),
so a test can assert that a system notification was sent, or that the in-page
banner appeared when notifications are blocked.

## Failure artifacts

On a failure Playwright keeps, under `test-results/<test>/`: `test-failed-1.png`
(the page at the moment of failure), `video.webm` (the whole test), `trace.zip`
(every action with DOM snapshots; open with `npx playwright show-trace <path>`
or from the HTML report), and `error-context.md` (the page's accessibility tree).

## The store contract

`packages/core/src/testing.ts` exports `storeContract(name, make)`: one suite
that every `CaffeineStore` must pass. `InMemoryStore` and `LocalStorageStore`
both run it. A future `HttpStore` would add one line.

## Writing a new test

- Prefer role and label selectors (`getByRole("button", { name: "[ save ]" })`).
  They test what a user sees, and they double as an accessibility check.
- Keep rules in `packages/core` and test them there first. An end-to-end test
  should prove the wiring, not re-test every branch.
- A new store, or a change to `CaffeineStore`, goes through the contract tests.

## Demo recipe: let the tests catch a bug

Before the live Part 3, plant a bug and let the audience watch the tests find it:

1. In `packages/core/src/rules.ts`, change the cut-off check from
   `nowMin >= clockToMinutes(settings.cutoffTime)` to `nowMin > …`.
   The reminder now fires at exactly the cut-off minute.
2. Run `npm test`. `rules.test.ts › skips past the cut-off` fails, naming the
   expected reason `past-cutoff` and the received `due`.
3. Ask Claude Code: "A test is failing. Find out why and fix it." It reads the
   failing assertion, the rule and the architecture doc's rule ordering, and
   restores `>=`.
4. Run `/code-review` on the change, then `npm run test:all` to go green.

A second option with a visible effect: in `apps/web/src/components/CoffeeCup.tsx`
swap `mg > safeLimit` for `mg >= safeLimit`. `CoffeeCup.test.tsx › turns amber at
the limit` and the Playwright test `turns amber at the limit and overflows past it`
both fail: the cup overflows at exactly 400 mg.
