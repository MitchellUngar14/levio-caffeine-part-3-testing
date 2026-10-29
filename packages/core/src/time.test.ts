import { clockOnDay, clockToMinutes, isValidTimeZone, shiftDayKey, weekdayOfDayKey, zonedParts, zonedTimeToInstant } from "./time";

describe("zonedParts", () => {
  it("reads wall-clock parts in the given zone", () => {
    const p = zonedParts(new Date("2026-10-29T03:30:00.000Z"), "America/Toronto"); // 23:30 the day before, EDT
    expect(p).toMatchObject({ year: 2026, month: 10, day: 28, hour: 23, minute: 30, weekday: 3, dayKey: "2026-10-28", minutesOfDay: 1410 });
  });
  it("treats midnight as hour 0, not 24", () => {
    expect(zonedParts(new Date("2026-10-29T04:00:00.000Z"), "America/Toronto").hour).toBe(0);
  });
  it("numbers Sunday as 7", () => {
    expect(zonedParts(new Date("2026-11-01T12:00:00.000Z"), "UTC").weekday).toBe(7);
  });
});

describe("zonedTimeToInstant / clockOnDay", () => {
  it("accounts for the zone offset", () => {
    expect(zonedTimeToInstant(2026, 10, 29, 9, 0, "America/Toronto").toISOString()).toBe("2026-10-29T13:00:00.000Z");
    expect(clockOnDay("2026-10-29", "09:00", "Asia/Tokyo").toISOString()).toBe("2026-10-29T00:00:00.000Z");
  });
  it("handles the day clocks go back (2026-11-01 in Toronto)", () => {
    expect(clockOnDay("2026-11-01", "00:30", "America/Toronto").toISOString()).toBe("2026-11-01T04:30:00.000Z"); // still EDT
    expect(clockOnDay("2026-11-01", "03:00", "America/Toronto").toISOString()).toBe("2026-11-01T08:00:00.000Z"); // EST
    expect(clockOnDay("2026-11-02", "09:00", "America/Toronto").toISOString()).toBe("2026-11-02T14:00:00.000Z");
  });
  it("handles the day clocks go forward (2026-03-08 in Toronto): 02:30 doesn't exist", () => {
    const t = clockOnDay("2026-03-08", "02:30", "America/Toronto");
    // Resolves to a real instant on that morning, within an hour of the gap.
    expect(t.getTime()).toBeGreaterThanOrEqual(Date.parse("2026-03-08T06:30:00.000Z"));
    expect(t.getTime()).toBeLessThanOrEqual(Date.parse("2026-03-08T07:30:00.000Z"));
  });
});

describe("day keys", () => {
  it("shifts across month and year boundaries", () => {
    expect(shiftDayKey("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDayKey("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftDayKey("2028-02-28", 1)).toBe("2028-02-29"); // leap year
  });
  it("knows the weekday", () => {
    expect(weekdayOfDayKey("2026-10-29")).toBe(4); // Thursday
    expect(weekdayOfDayKey("2026-11-01")).toBe(7); // Sunday
  });
  it("parses clock times", () => {
    expect(clockToMinutes("09:05")).toBe(545);
    expect(clockToMinutes("00:00")).toBe(0);
  });
  it("validates time zones", () => {
    expect(isValidTimeZone("Europe/London")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
  });
});
