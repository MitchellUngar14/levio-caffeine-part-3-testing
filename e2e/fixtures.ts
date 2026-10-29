import { test as base, expect, type Page } from "@playwright/test";

/**
 * Thursday 2026-10-29, 10:00 in America/Toronto (14:00 UTC).
 * Inside the default work hours (09:00–17:00), before the 15:00 cut-off.
 */
export const THURSDAY_10AM = new Date("2026-10-29T14:00:00.000Z");

export interface AppPage {
  page: Page;
  /** Opens the app with a frozen clock. Timers only advance through `tick`. */
  open(opts?: { time?: Date; hash?: string; demo?: boolean }): Promise<void>;
  /** Advances the fake clock, running any timers that come due. */
  tick(duration: string): Promise<void>;
  /** Opens the add-drink dialog, searches, and logs the first match. */
  logDrink(query: string): Promise<void>;
  /** Opens the add-drink dialog and saves + logs a custom drink. */
  logCustom(name: string, mg: number, serving?: string): Promise<void>;
  /** The system notifications the app tried to show (Notification API is stubbed). */
  notifications(): Promise<{ title: string; body: string }[]>;
}

export const test = base.extend<{ app: AppPage }>({
  app: async ({ page, context }, use) => {
    await context.grantPermissions([]);
    const app: AppPage = {
      page,
      async open({ time = THURSDAY_10AM, hash = "/today", demo = false } = {}) {
        await page.clock.install({ time });
        await page.goto(`/${demo ? "?demo=1" : ""}#${hash}`);
        await expect(page.getByRole("link", { name: "./today" })).toBeVisible();
      },
      async tick(duration) {
        await page.clock.fastForward(duration);
      },
      async logDrink(query) {
        await page.getByRole("button", { name: /add a drink/i }).first().click();
        const search = page.getByRole("searchbox", { name: "search drinks" });
        await expect(search).toBeFocused();
        await search.fill(query);
        await page.getByRole("button", { name: /^Log / }).first().click();
        await expect(page.getByRole("dialog")).toBeHidden();
      },
      async logCustom(name, mg, serving) {
        await page.getByRole("button", { name: /add a drink/i }).first().click();
        const dialog = page.getByRole("dialog");
        await dialog.getByLabel("name").fill(name);
        await dialog.getByLabel("caffeine_mg").fill(String(mg));
        if (serving) await dialog.getByLabel("serving").fill(serving);
        await dialog.getByRole("button", { name: "[ save + log ]" }).click();
        await expect(dialog).toBeHidden();
      },
      async notifications() {
        return page.evaluate(() => (window as unknown as { __notifications: { title: string; body: string }[] }).__notifications ?? []);
      },
    };
    await use(app);
  },
});

/** Replaces window.Notification with a stub that records calls, with the given permission. */
export async function stubNotifications(page: Page, permission: "granted" | "denied" | "default"): Promise<void> {
  await page.addInitScript((perm) => {
    const calls: { title: string; body: string }[] = [];
    (window as unknown as { __notifications: typeof calls }).__notifications = calls;
    class FakeNotification {
      static permission = perm;
      static requestPermission = async () => perm;
      onclick: (() => void) | null = null;
      constructor(title: string, options?: { body?: string }) {
        calls.push({ title, body: options?.body ?? "" });
      }
      close() {}
    }
    Object.defineProperty(window, "Notification", { value: FakeNotification, configurable: true });
  }, permission);
}

export { expect };
