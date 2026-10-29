import { expect, stubNotifications, test } from "./fixtures";

test.describe("settings", () => {
  test("detects the time zone and saves work hours and limits", async ({ app }) => {
    await app.open({ hash: "/settings" });
    await expect(app.page.getByLabel("time_zone")).toHaveValue("America/Toronto");
    await expect(app.page.getByRole("option", { name: "America/Toronto (detected)" })).toBeAttached();

    await app.page.getByLabel("start", { exact: true }).fill("08:00");
    await app.page.getByLabel("end", { exact: true }).fill("16:00");
    await app.page.getByLabel("daily_limit_mg").fill("300");
    await app.page.getByLabel("cutoff").fill("14:00");
    await app.page.getByRole("checkbox", { name: "sat" }).check();
    await app.page.getByRole("button", { name: "[ save ]" }).click();
    await expect(app.page.getByText("saved")).toBeVisible();

    await app.page.reload();
    await expect(app.page.getByLabel("start", { exact: true })).toHaveValue("08:00");
    await expect(app.page.getByLabel("daily_limit_mg")).toHaveValue("300");
    await expect(app.page.getByRole("checkbox", { name: "sat" })).toBeChecked();
    await app.page.getByRole("link", { name: "./today" }).click();
    await expect(app.page.getByText("tz=America/Toronto · 08:00–16:00")).toBeVisible();
    await expect(app.page.getByText("daily_limit", { exact: true }).locator("..")).toContainText("300 mg");
  });

  test("blocks saving when nothing is valid", async ({ app }) => {
    await app.open({ hash: "/settings" });
    for (const d of ["mon", "tue", "wed", "thu", "fri"]) await app.page.getByRole("checkbox", { name: d }).uncheck();
    await expect(app.page.getByRole("alert")).toContainText("pick at least one work day");
    await expect(app.page.getByRole("button", { name: "[ save ]" })).toBeDisabled();
  });

  test("manages set reminder times and keeps them inside work hours", async ({ app }) => {
    await app.open({ hash: "/settings" });
    await app.page.getByRole("radio", { name: "at set times" }).check();
    await expect(app.page.getByRole("button", { name: "Remove 10:00" })).toBeVisible();
    await expect(app.page.getByRole("button", { name: "Remove 13:30" })).toBeVisible();
    await app.page.getByRole("button", { name: "Remove 13:30" }).click();
    await expect(app.page.getByRole("button", { name: "Remove 13:30" })).toBeHidden();

    await app.page.getByLabel("New reminder time").fill("18:00");
    await app.page.getByRole("button", { name: "+ add time" }).click();
    await expect(app.page.getByRole("alert")).toContainText("reminder times must fall within work hours");
    await app.page.getByRole("button", { name: "Remove 18:00" }).click();
    await expect(app.page.getByRole("button", { name: "[ save ]" })).toBeEnabled();
  });

  test("switches theme from the header and from settings", async ({ app }) => {
    await app.open();
    const html = app.page.locator("html");
    await app.page.getByRole("button", { name: "Switch colour theme" }).click();
    await expect(html).toHaveAttribute("data-theme", /light|dark/);
    const chosen = await html.getAttribute("data-theme");
    await app.page.reload();
    await expect(html).toHaveAttribute("data-theme", chosen!); // applied before React, no flash

    await app.page.getByRole("link", { name: "./settings" }).click();
    await app.page.getByRole("radio", { name: "system" }).check();
    await app.page.getByRole("button", { name: "[ save ]" }).click();
    await expect(html).not.toHaveAttribute("data-theme", /./);
  });

  test("reports notification permission and sends a test", async ({ app }) => {
    await stubNotifications(app.page, "granted");
    await app.open({ hash: "/settings" });
    await expect(app.page.getByText("notifications: granted")).toBeVisible();
    await expect(app.page.getByRole("button", { name: "[ allow ]" })).toBeHidden();
    await app.page.getByRole("button", { name: "[ send test ]" }).click();
    expect(await app.notifications()).toEqual([{ title: "caffeine_tracker", body: "Test reminder: this is what one looks like." }]);
    await expect(app.page.getByText("test sent")).toBeVisible();
  });

  test("exports a JSON backup", async ({ app }) => {
    await app.open();
    await app.logDrink("espresso");
    await app.page.getByRole("link", { name: "./settings" }).click();
    const downloadPromise = app.page.waitForEvent("download");
    await app.page.getByRole("button", { name: "[ export ]" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("caffeine-tracker-2026-10-29.json");
    const text = await (await download.createReadStream()).toArray().then((chunks) => Buffer.concat(chunks).toString("utf8"));
    const file = JSON.parse(text) as { version: number; intakes: { name: string }[] };
    expect(file.version).toBe(1);
    expect(file.intakes[0]?.name).toContain("Espresso");
  });
});

test.describe("persistence", () => {
  test("keeps drinks and the drawer state across a reload", async ({ app }) => {
    await app.open();
    await app.logDrink("green tea");
    await app.page.getByRole("button", { name: "Hide today’s drinks" }).click();
    await expect(app.page.getByRole("button", { name: "Show today’s drinks" })).toBeVisible();
    await expect(app.page.getByText("history · 1 drink")).toBeVisible();

    await app.page.reload();
    await expect(app.page.getByRole("button", { name: "Show today’s drinks" })).toBeVisible();
    await expect(app.page.getByRole("img", { name: /28 of 400/ })).toBeVisible();

    await app.page.getByRole("button", { name: "Show today’s drinks" }).click();
    await expect(app.page.getByText("Green tea · 240 ml (8 oz)")).toBeVisible();
  });

  test("adding a drink from the collapsed strip works", async ({ app }) => {
    await app.open();
    await app.page.getByRole("button", { name: "Hide today’s drinks" }).click();
    await app.logDrink("pepsi");
    await expect(app.page.getByText("history · 1 drink")).toBeVisible();
    await expect(app.page.getByRole("img", { name: /38 of 400/ })).toBeVisible();
  });

  test("yesterday's drinks don't count today", async ({ app }) => {
    await app.open({ time: new Date("2026-10-28T20:00:00.000Z") }); // Wed 16:00
    await app.logDrink("monster");
    await app.page.clock.setFixedTime(new Date("2026-10-29T14:00:00.000Z")); // Thu 10:00
    await app.page.reload();
    await expect(app.page.getByText("cup empty: log a drink")).toBeVisible();
    await app.page.getByRole("link", { name: "./calendar" }).click();
    await expect(app.page.getByRole("button", { name: /Wed, Oct 28: 160 mg, 40% of daily limit/ })).toBeVisible();
  });
});
