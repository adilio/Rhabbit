import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  dateKey,
  daysBetween,
  parseKey,
  todayKey,
  weekStart,
  weekdayOf,
} from "../src/lib/dates";

afterEach(() => {
  vi.useRealTimers();
});

describe("dateKey", () => {
  it("zero-pads month and day", () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("uses local calendar fields, not the UTC instant", () => {
    // 2026-07-19 23:30 local. In any timezone east of UTC this instant is
    // already the 20th in UTC, so a toISOString()-based key would drift.
    expect(dateKey(new Date(2026, 6, 19, 23, 30))).toBe("2026-07-19");
  });

  it("round-trips through parseKey", () => {
    expect(dateKey(parseKey("2026-02-28"))).toBe("2026-02-28");
  });
});

describe("addDays", () => {
  it("rolls over month boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("rolls over year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("handles leap days", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("goes backwards", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("is identity for zero", () => {
    expect(addDays("2026-07-19", 0)).toBe("2026-07-19");
  });

  // The DST cases are the reason dates.ts exists. Adding a day across a
  // transition must land on the next calendar day, not 23 or 25 hours later.
  it("crosses spring-forward without skipping a day", () => {
    expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
  });

  it("crosses fall-back without repeating a day", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
  });

  it("walks a full year one day at a time and stays aligned", () => {
    let key = "2026-01-01";
    for (let i = 0; i < 365; i++) key = addDays(key, 1);
    expect(key).toBe("2027-01-01");
  });
});

describe("daysBetween", () => {
  it("counts forward and backward", () => {
    expect(daysBetween("2026-07-19", "2026-07-26")).toBe(7);
    expect(daysBetween("2026-07-26", "2026-07-19")).toBe(-7);
  });

  it("is zero for the same day", () => {
    expect(daysBetween("2026-07-19", "2026-07-19")).toBe(0);
  });

  // Uses Math.round precisely so a 23- or 25-hour DST day still reads as 1.
  it("returns whole days across a DST transition", () => {
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2);
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2);
  });
});

describe("weekdayOf", () => {
  it("maps Sunday to 0 and Saturday to 6", () => {
    expect(weekdayOf("2026-07-19")).toBe(0);
    expect(weekdayOf("2026-07-25")).toBe(6);
  });
});

describe("weekStart", () => {
  // 2026-07-22 is a Wednesday.
  it("finds the preceding Sunday", () => {
    expect(weekStart("2026-07-22", "sunday")).toBe("2026-07-19");
  });

  it("finds the preceding Monday", () => {
    expect(weekStart("2026-07-22", "monday")).toBe("2026-07-20");
  });

  it("is a no-op when the day is already the start of the week", () => {
    expect(weekStart("2026-07-19", "sunday")).toBe("2026-07-19");
    expect(weekStart("2026-07-20", "monday")).toBe("2026-07-20");
  });

  // The off-by-one trap: on a Sunday with weeks starting Monday, the week
  // began six days earlier, not on the same day.
  it("treats Sunday as the end of a Monday-started week", () => {
    expect(weekStart("2026-07-19", "monday")).toBe("2026-07-13");
  });
});

describe("todayKey", () => {
  it("reads the current local date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 19, 23, 59));
    expect(todayKey()).toBe("2026-07-19");
  });
});
