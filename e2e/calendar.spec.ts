import { expect, test } from "./fixtures";

test.describe("calendar", () => {
  test("shows today's total with the right colour level", async ({ app }) => {
    await app.open();
    await app.logDrink("coffee, brewed"); // 96 mg → 24%
    await app.page.getByRole("link", { name: "./calendar" }).click();

    await expect(app.page.getByRole("heading", { name: /cal --month 2026-10/ })).toBeVisible();
    const today = app.page.getByRole("button", { name: /Thu, Oct 29: 96 mg, 24% of daily limit/ });
    await expect(today).toHaveClass(/some/);
    await expect(today).toContainText("24%");
    await expect(app.page.getByRole("button", { name: /Wed, Oct 28: 0 mg, no caffeine/ })).toHaveClass(/none/);
    await expect(app.page.getByRole("button", { name: /Fri, Oct 30: no data yet/ })).toBeDisabled();

    const summary = app.page.getByRole("complementary", { name: "Month summary" });
    await expect(summary).toContainText("Thu, Oct 29");
    await expect(summary).toContainText("96");
    await expect(summary).toContainText("24% of your 400 mg limit");
    await expect(summary.getByText("caffeine_days", { exact: true }).locator("..")).toContainText("1");
  });

  test("marks a day over the limit in the overflow colour", async ({ app }) => {
    await app.open();
    await app.logCustom("Triple", 450);
    await app.page.getByRole("link", { name: "./calendar" }).click();
    const today = app.page.getByRole("button", { name: /Thu, Oct 29: 450 mg, over the limit/ });
    await expect(today).toHaveClass(/over/);
    await expect(today).toContainText("113%");
    await expect(app.page.getByText("!! 113%: over by 50 mg")).toBeVisible();
    await expect(app.page.getByText("over_limit_days", { exact: true }).locator("..")).toContainText("1");
  });

  test("steps back a month and not forward past the current one", async ({ app }) => {
    await app.open({ hash: "/calendar" });
    await expect(app.page.getByRole("button", { name: "Next month" })).toBeDisabled();
    await app.page.getByRole("button", { name: "Previous month" }).click();
    await expect(app.page.getByRole("heading", { name: /cal --month 2026-09/ })).toBeVisible();
    await expect(app.page.getByRole("grid", { name: "September 2026" })).toBeVisible();
    await app.page.getByRole("button", { name: "Next month" }).click();
    await expect(app.page.getByRole("heading", { name: /cal --month 2026-10/ })).toBeVisible();
  });

  test("selecting a day shows its details", async ({ app }) => {
    await app.open({ hash: "/calendar" });
    await app.page.getByRole("button", { name: /Mon, Oct 5/ }).click();
    const summary = app.page.getByRole("complementary", { name: "Month summary" });
    await expect(summary).toContainText("Mon, Oct 5");
    await expect(summary).toContainText("no caffeine");
  });
});
