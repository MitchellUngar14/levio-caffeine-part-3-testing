import { expect, test } from "./fixtures";

test.describe("logging a drink", () => {
  test("starts empty, with the cup empty", async ({ app }) => {
    await app.open();
    await expect(app.page.getByRole("img", { name: /Coffee cup 0 percent full/ })).toBeVisible();
    await expect(app.page.getByText("cup empty: log a drink")).toBeVisible();
    await expect(app.page.getByText("nothing logged yet today.")).toBeVisible();
    await expect(app.page.getByText("0 drinks")).toBeVisible();
  });

  test("logs a drink from search and updates the cup, history and metrics", async ({ app }) => {
    await app.open();
    await app.logDrink("coke zero");

    const history = app.page.getByRole("complementary", { name: "Today’s drinks" });
    await expect(history.getByText("Coke Zero · 355 ml (12 oz) can")).toBeVisible();
    await expect(history.getByText("34 mg")).toBeVisible();
    await expect(history.getByText("10:00")).toBeVisible();
    await expect(app.page.getByRole("img", { name: /Coffee cup 9 percent full: 34 of 400/ })).toBeVisible();
    await expect(app.page.getByText("9% of daily limit")).toBeVisible();
    await expect(app.page.getByText("1 drink", { exact: true })).toBeVisible();
    await expect(app.page.getByLabel("34 of 400 milligrams", { exact: true })).toContainText("9% of limit");
  });

  test("searches by alias and tolerates typos", async ({ app }) => {
    await app.open();
    await app.page.getByRole("button", { name: /add a drink/i }).click();
    const search = app.page.getByRole("searchbox", { name: "search drinks" });
    await search.fill("expresso");
    await expect(app.page.getByRole("dialog").getByText("Espresso", { exact: true })).toBeVisible();
    await search.fill("energy drink");
    await expect(app.page.getByRole("dialog").getByText("Red Bull", { exact: true })).toBeVisible();
    await search.fill("zzzzqq");
    await expect(app.page.getByText(/no match for/)).toBeVisible();
  });

  test("adds a custom drink, which then shows first in search", async ({ app }) => {
    await app.open();
    await app.logCustom("Office cold brew", 200, "473 ml");
    const history = app.page.getByRole("complementary", { name: "Today’s drinks" });
    await expect(history.getByText("Office cold brew · 473 ml")).toBeVisible();
    await expect(history.getByText("200 mg", { exact: true })).toBeVisible();

    await app.page.getByRole("button", { name: /add a drink/i }).click();
    const rows = app.page.getByRole("dialog").locator(".row");
    await expect(rows.first()).toContainText("Office cold brew");
    await expect(rows.first()).toContainText("yours");
  });

  test("rejects a custom drink without a name or mg", async ({ app }) => {
    await app.open();
    await app.page.getByRole("button", { name: /add a drink/i }).click();
    await app.page.getByRole("button", { name: "[ save + log ]" }).click();
    await expect(app.page.getByRole("alert")).toHaveText("needs a name and mg above 0");
    await expect(app.page.getByRole("dialog")).toBeVisible();
  });

  test("removes a drink from the history", async ({ app }) => {
    await app.open();
    await app.logDrink("espresso");
    await app.page.getByRole("button", { name: /^Remove 10:00 Espresso/ }).click();
    await expect(app.page.getByText("nothing logged yet today.")).toBeVisible();
    await expect(app.page.getByText("cup empty: log a drink")).toBeVisible();
  });

  test("closes the dialog with Escape and by clicking outside", async ({ app }) => {
    await app.open();
    await app.page.getByRole("button", { name: /add a drink/i }).click();
    await expect(app.page.getByRole("dialog")).toBeVisible();
    await app.page.keyboard.press("Escape");
    await expect(app.page.getByRole("dialog")).toBeHidden();

    await app.page.getByRole("button", { name: /add a drink/i }).click();
    await app.page.mouse.click(5, 300); // the backdrop
    await expect(app.page.getByRole("dialog")).toBeHidden();
  });
});

test.describe("the coffee cup", () => {
  test("turns amber at the limit and overflows past it", async ({ app }) => {
    await app.open();
    await app.logCustom("Big one", 400);
    await expect(app.page.getByText("limit reached")).toBeVisible();
    await expect(app.page.getByRole("img", { name: /100 percent full: 400 of 400 milligrams$/ })).toBeVisible();

    await app.logDrink("coke zero");
    await expect(app.page.getByText("!! overflow: +34 mg")).toBeVisible();
    await expect(app.page.getByRole("img", { name: /overflowing/ })).toBeVisible();
    await expect(app.page.getByText("!! over your daily limit by 34 mg")).toBeVisible();
    await expect(app.page.getByLabel("434 of 400 milligrams", { exact: true })).toContainText("109% of limit");
  });
});
