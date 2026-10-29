import { asciiBar, clock, dayLabel, pct } from "./format";

describe("format helpers", () => {
  it("formats a clock time in the given zone", () => {
    expect(clock("2026-10-29T14:05:00.000Z", "America/Toronto")).toBe("10:05");
    expect(clock(new Date("2026-10-29T14:05:00.000Z"), "Asia/Tokyo")).toBe("23:05");
  });
  it("labels a day without depending on the machine zone", () => {
    expect(dayLabel("2026-10-29")).toBe("Thu, Oct 29");
  });
  it("rounds percentages and guards against a zero limit", () => {
    expect(pct(34, 400)).toBe(9);
    expect(pct(10, 0)).toBe(0);
  });
  it("draws a 20-cell bar, capped at full", () => {
    expect(asciiBar(0, 400)).toEqual({ on: "", off: "░".repeat(20) });
    expect(asciiBar(200, 400).on).toHaveLength(10);
    expect(asciiBar(900, 400)).toEqual({ on: "█".repeat(20), off: "" });
  });
});
