import { expect, stubNotifications, test } from "./fixtures";

test.describe("reminders", () => {
  test("shows a system notification 3 hours after work starts with no caffeine", async ({ app }) => {
    await stubNotifications(app.page, "granted");
    await app.open(); // 10:00, work started 09:00, gap 180 min → due at 12:00
    await expect(app.page.getByText("12:00")).toBeVisible(); // next_reminder tile

    await app.tick("01:59:00");
    expect(await app.notifications()).toHaveLength(0);

    await app.tick("00:02:00");
    const sent = await app.notifications();
    expect(sent).toHaveLength(1);
    expect(sent[0]?.title).toBe("caffeine_tracker");
    await expect(app.page.getByRole("status")).toBeHidden(); // no banner when the notification worked
  });

  test("falls back to an in-page banner when notifications are blocked", async ({ app }) => {
    await stubNotifications(app.page, "denied");
    await app.open();
    await app.tick("02:01:00");
    const banner = app.page.getByRole("status");
    await expect(banner).toContainText("No caffeine for a while");
    await banner.getByRole("button", { name: "[ ok ]" }).click();
    await expect(banner).toBeHidden();
  });

  test("resets the countdown when a drink is logged", async ({ app }) => {
    await stubNotifications(app.page, "granted");
    await app.open();
    await app.tick("01:00:00"); // 11:00
    await app.logDrink("black tea");
    await expect(app.page.getByText("14:00")).toBeVisible(); // 11:00 + 3 h
    await app.tick("02:00:00"); // 13:00: 12:00 would have fired without the drink
    expect(await app.notifications()).toHaveLength(0);
  });

  test("never reminds past the cut-off or over the limit", async ({ app }) => {
    await stubNotifications(app.page, "granted");
    await app.open({ time: new Date("2026-10-29T18:30:00.000Z") }); // 14:30 Toronto
    await app.tick("01:00:00"); // crosses the 15:00 cut-off before 3 h have passed since 09:00? No: due since 12:00.
    // It was already due at open (no caffeine since 09:00), so one fires right away…
    expect(await app.notifications()).toHaveLength(1);
    // …but nothing more after the cut-off, however long we wait.
    await app.tick("06:00:00");
    expect(await app.notifications()).toHaveLength(1);
  });

  test("demo mode reminds within a minute", async ({ app }) => {
    await stubNotifications(app.page, "denied");
    await app.open({ demo: true });
    await expect(app.page.getByText("--demo")).toBeVisible();
    await app.tick("00:00:30");
    await expect(app.page.getByRole("status")).toBeVisible(); // due since 09:01
  });

  test("set-times mode fires at each time only without caffeine since the previous one", async ({ app }) => {
    await stubNotifications(app.page, "granted");
    await app.open({ time: new Date("2026-10-29T13:30:00.000Z"), hash: "/settings" }); // 09:30
    await app.page.getByRole("radio", { name: "at set times" }).check();
    await app.page.getByRole("button", { name: "[ save ]" }).click();
    await expect(app.page.getByText("saved")).toBeVisible();
    await app.page.getByRole("link", { name: "./today" }).click();
    await expect(app.page.getByText("10:00")).toBeVisible(); // next_reminder

    await app.tick("00:31:00"); // 10:01 → the 10:00 reminder
    expect(await app.notifications()).toHaveLength(1);
    await app.tick("01:00:00"); // 11:01, nothing new
    expect(await app.notifications()).toHaveLength(1);

    await app.logDrink("espresso"); // 11:01: caffeine since 10:00, so 13:30 is skipped
    await app.tick("03:00:00"); // 14:01
    expect(await app.notifications()).toHaveLength(1);
  });

  test("checks again when the tab becomes visible after sleep", async ({ app }) => {
    await stubNotifications(app.page, "granted");
    await app.open();
    // Jump the clock without running timers, as if the laptop slept.
    await app.page.clock.setFixedTime(new Date("2026-10-29T17:30:00.000Z")); // 13:30
    await app.page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect.poll(() => app.notifications()).toHaveLength(1);
  });
});
