import { describe, expect, it } from "vitest";
import {
  completionsThisWeek,
  isScheduledOn,
  isStrictlyScheduled,
  scheduleSummary,
} from "../src/lib/schedule";
import type { Entry, Habit } from "../src/lib/types";
import { habit, entry, entryMap } from "./factories";

describe("isScheduledOn", () => {
  it("schedules a daily habit on every day", () => {
    const h = habit({ schedule: { kind: "daily", weekdays: [], timesPerWeek: 0 } });
    expect(isScheduledOn(h, "2026-07-19")).toBe(true);
    expect(isScheduledOn(h, "2026-07-22")).toBe(true);
  });

  it("schedules a weekday habit only on its listed days", () => {
    // Mon/Wed/Fri. 2026-07-20 is a Monday, 2026-07-21 a Tuesday.
    const h = habit({ schedule: { kind: "weekdays", weekdays: [1, 3, 5], timesPerWeek: 0 } });
    expect(isScheduledOn(h, "2026-07-20")).toBe(true);
    expect(isScheduledOn(h, "2026-07-21")).toBe(false);
    expect(isScheduledOn(h, "2026-07-22")).toBe(true);
  });

  it("shows a flexible habit every day", () => {
    const h = habit({ schedule: { kind: "timesPerWeek", weekdays: [], timesPerWeek: 3 } });
    expect(isScheduledOn(h, "2026-07-21")).toBe(true);
  });

  it("never schedules an archived habit", () => {
    const h = habit({ archivedAt: Date.UTC(2026, 6, 1) });
    expect(isScheduledOn(h, "2026-07-19")).toBe(false);
  });

  it("suppresses a paused habit until the pause date, then resumes", () => {
    const h = habit({ pausedUntil: "2026-07-25" });
    expect(isScheduledOn(h, "2026-07-24")).toBe(false);
    // The boundary is inclusive of the resume day itself.
    expect(isScheduledOn(h, "2026-07-25")).toBe(true);
    expect(isScheduledOn(h, "2026-07-26")).toBe(true);
  });
});

describe("isStrictlyScheduled", () => {
  it("is true for scheduled daily and weekday habits", () => {
    expect(isStrictlyScheduled(habit(), "2026-07-19")).toBe(true);
  });

  // This is the forgiveness rule: a flexible habit can never produce a
  // single-day miss, because a shortfall belongs to the week, not a day.
  it("is false for flexible habits even though they are shown daily", () => {
    const h = habit({ schedule: { kind: "timesPerWeek", weekdays: [], timesPerWeek: 3 } });
    expect(isScheduledOn(h, "2026-07-21")).toBe(true);
    expect(isStrictlyScheduled(h, "2026-07-21")).toBe(false);
  });

  it("is false on an unscheduled weekday", () => {
    const h = habit({ schedule: { kind: "weekdays", weekdays: [1], timesPerWeek: 0 } });
    expect(isStrictlyScheduled(h, "2026-07-21")).toBe(false);
  });
});

describe("completionsThisWeek", () => {
  const h = habit({ id: "h1", schedule: { kind: "timesPerWeek", weekdays: [], timesPerWeek: 3 } });

  it("counts completions from the week start up to the given day", () => {
    // Week of Sun 2026-07-19.
    const map = entryMap([
      entry("h1", "2026-07-19", "complete"),
      entry("h1", "2026-07-21", "complete"),
    ]);
    expect(completionsThisWeek(h, "2026-07-22", map, "sunday")).toBe(2);
  });

  it("does not count days later in the week than the reference day", () => {
    const map = entryMap([
      entry("h1", "2026-07-19", "complete"),
      entry("h1", "2026-07-24", "complete"),
    ]);
    expect(completionsThisWeek(h, "2026-07-21", map, "sunday")).toBe(1);
  });

  it("ignores skipped days", () => {
    const map = entryMap([
      entry("h1", "2026-07-19", "complete"),
      entry("h1", "2026-07-20", "skipped"),
    ]);
    expect(completionsThisWeek(h, "2026-07-22", map, "sunday")).toBe(1);
  });

  it("respects the week-start setting", () => {
    // Sunday 2026-07-19 belongs to the *previous* Monday-started week, so it
    // must not count toward the week containing Wednesday 2026-07-22.
    const map = entryMap([
      entry("h1", "2026-07-19", "complete"),
      entry("h1", "2026-07-21", "complete"),
    ]);
    expect(completionsThisWeek(h, "2026-07-22", map, "sunday")).toBe(2);
    expect(completionsThisWeek(h, "2026-07-22", map, "monday")).toBe(1);
  });

  it("does not count another habit's entries", () => {
    const map = entryMap([entry("other", "2026-07-20", "complete")]);
    expect(completionsThisWeek(h, "2026-07-22", map, "sunday")).toBe(0);
  });
});

describe("scheduleSummary", () => {
  it("describes a daily habit", () => {
    expect(scheduleSummary(habit())).toBe("Every day");
  });

  it("collapses all seven weekdays to 'Every day'", () => {
    const h = habit({
      schedule: { kind: "weekdays", weekdays: [0, 1, 2, 3, 4, 5, 6], timesPerWeek: 0 },
    });
    expect(scheduleSummary(h)).toBe("Every day");
  });

  it("lists weekdays in week order regardless of input order", () => {
    const h = habit({ schedule: { kind: "weekdays", weekdays: [5, 1, 3], timesPerWeek: 0 } });
    expect(scheduleSummary(h)).toBe("Mon · Wed · Fri");
  });

  it("singularises a once-a-week habit", () => {
    const once = habit({ schedule: { kind: "timesPerWeek", weekdays: [], timesPerWeek: 1 } });
    const thrice = habit({ schedule: { kind: "timesPerWeek", weekdays: [], timesPerWeek: 3 } });
    expect(scheduleSummary(once)).toBe("Once a week");
    expect(scheduleSummary(thrice)).toBe("3× a week");
  });
});

// Guards against a habit object drifting away from what these tests assume.
describe("factories", () => {
  it("produces a daily habit by default", () => {
    const h: Habit = habit();
    expect(h.schedule.kind).toBe("daily");
    expect(h.archivedAt).toBeNull();
  });

  it("keys entries by habit and date", () => {
    const e: Entry = entry("h1", "2026-07-19", "complete");
    expect(entryMap([e]).get("h1_2026-07-19")).toBe(e);
  });
});
