import { describe, expect, it } from "vitest";
import { completionWindow, computeStats } from "../src/lib/stats";
import { completions, entry, habit } from "./factories";

const TODAY = "2026-07-22"; // a Wednesday

function statsFor(h = habit(), entries = [] as ReturnType<typeof entry>[]) {
  return computeStats(h, entries, TODAY);
}

describe("computeStats — streaks", () => {
  it("reports zero for a habit with no entries", () => {
    const s = statsFor();
    expect(s.currentStreak).toBe(0);
    expect(s.bestStreak).toBe(0);
    expect(s.totalCompletions).toBe(0);
    expect(s.bestWeekday).toBeNull();
  });

  it("counts consecutive completions up to today", () => {
    const s = statsFor(
      habit(),
      completions("h1", ["2026-07-20", "2026-07-21", "2026-07-22"]),
    );
    expect(s.currentStreak).toBe(3);
    expect(s.bestStreak).toBe(3);
  });

  it("breaks the current streak on a missed scheduled day", () => {
    // 07-19 and 07-20 done, 07-21 missed, 07-22 done.
    const s = statsFor(
      habit(),
      completions("h1", ["2026-07-19", "2026-07-20", "2026-07-22"]),
    );
    expect(s.currentStreak).toBe(1);
    expect(s.bestStreak).toBe(2);
  });

  it("keeps the best streak after the current one breaks", () => {
    const s = statsFor(
      habit(),
      completions("h1", ["2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17", "2026-07-22"]),
    );
    expect(s.bestStreak).toBe(4);
    expect(s.currentStreak).toBe(1);
  });

  // The forgiveness rules: neither a skip nor an unscheduled day is a miss.
  it("treats a skipped day as neutral rather than a break", () => {
    const s = statsFor(habit(), [
      ...completions("h1", ["2026-07-20", "2026-07-22"]),
      entry("h1", "2026-07-21", "skipped"),
    ]);
    expect(s.currentStreak).toBe(2);
  });

  it("treats an unscheduled weekday as neutral", () => {
    // Mon/Wed/Fri only, so Tue 07-21 is not a miss.
    const h = habit({ schedule: { kind: "weekdays", weekdays: [1, 3, 5], timesPerWeek: 0 } });
    const s = statsFor(h, completions("h1", ["2026-07-20", "2026-07-22"]));
    expect(s.currentStreak).toBe(2);
  });

  it("does not count today as a miss before it is logged", () => {
    // Streak runs through yesterday; today is simply not yet done.
    const s = statsFor(habit(), completions("h1", ["2026-07-20", "2026-07-21"]));
    expect(s.currentStreak).toBe(2);
  });

  it("never breaks the streak of a flexible habit on a quiet day", () => {
    const h = habit({ schedule: { kind: "timesPerWeek", weekdays: [], timesPerWeek: 2 } });
    const s = statsFor(h, completions("h1", ["2026-07-15", "2026-07-22"]));
    expect(s.currentStreak).toBe(2);
  });
});

describe("computeStats — comebacks", () => {
  // Each habit is created on the day of its first completion, so the only
  // gaps these tests measure are the ones written into the entries. A habit
  // created earlier than its first entry accrues real misses in between —
  // that behaviour is pinned separately below.
  const from = (createdOn: string) =>
    habit({ createdAt: new Date(`${createdOn}T00:00:00`).getTime() });

  it("counts a return after a gap", () => {
    const s = statsFor(
      from("2026-07-18"),
      completions("h1", ["2026-07-18", "2026-07-22"]),
    );
    expect(s.comebacks).toBe(1);
  });

  it("counts each separate gap", () => {
    const s = statsFor(
      from("2026-07-14"),
      completions("h1", ["2026-07-14", "2026-07-17", "2026-07-22"]),
    );
    expect(s.comebacks).toBe(2);
  });

  it("does not count an unbroken run as a comeback", () => {
    const s = statsFor(
      from("2026-07-20"),
      completions("h1", ["2026-07-20", "2026-07-21", "2026-07-22"]),
    );
    expect(s.comebacks).toBe(0);
  });

  // A gap you deliberately skipped is not something to "come back" from.
  it("does not count a return after only skipped days", () => {
    const s = statsFor(from("2026-07-20"), [
      ...completions("h1", ["2026-07-20", "2026-07-22"]),
      entry("h1", "2026-07-21", "skipped"),
    ]);
    expect(s.comebacks).toBe(0);
  });

  // A habit created long before its first entry has genuinely been missed in
  // between, so the first completion is itself a comeback.
  it("counts the first completion of a long-dormant habit as a comeback", () => {
    const s = statsFor(
      from("2026-07-01"),
      completions("h1", ["2026-07-22"]),
    );
    expect(s.comebacks).toBe(1);
    expect(s.currentStreak).toBe(1);
  });
});

describe("computeStats — totals and weekday", () => {
  it("counts every completion regardless of gaps", () => {
    const s = statsFor(
      habit(),
      completions("h1", ["2026-07-05", "2026-07-14", "2026-07-22"]),
    );
    expect(s.totalCompletions).toBe(3);
  });

  it("identifies the most-completed weekday", () => {
    // Three Wednesdays, one Monday.
    const s = statsFor(
      habit(),
      completions("h1", ["2026-07-08", "2026-07-15", "2026-07-22", "2026-07-20"]),
    );
    expect(s.bestWeekday).toBe("Wednesday");
  });
});

describe("completionWindow", () => {
  const byDate = (entries: ReturnType<typeof entry>[]) =>
    new Map(entries.map((e) => [e.date, e]));

  it("returns a null rate when nothing was scheduled", () => {
    const h = habit({ createdAt: new Date(2026, 6, 22).getTime() });
    expect(completionWindow(h, byDate([]), TODAY, 7).rate).toBeNull();
  });

  it("scores completed over scheduled", () => {
    const w = completionWindow(
      habit(),
      byDate(completions("h1", ["2026-07-20", "2026-07-21"])),
      TODAY,
      3,
    );
    // Window is 07-20, 07-21, 07-22; today is excluded from the denominator.
    expect(w.done).toBe(2);
    expect(w.scheduled).toBe(2);
    expect(w.rate).toBe(1);
  });

  it("excludes skipped days from the denominator", () => {
    const w = completionWindow(
      habit(),
      byDate([
        ...completions("h1", ["2026-07-20"]),
        entry("h1", "2026-07-21", "skipped"),
      ]),
      TODAY,
      3,
    );
    expect(w.scheduled).toBe(1);
    expect(w.rate).toBe(1);
  });

  it("counts misses against the rate", () => {
    const w = completionWindow(
      habit(),
      byDate(completions("h1", ["2026-07-20"])),
      TODAY,
      3,
    );
    expect(w.done).toBe(1);
    expect(w.scheduled).toBe(2);
    expect(w.rate).toBe(0.5);
  });

  // A habit created three days ago should not be judged against a 30-day window.
  it("ignores the part of the window before the habit existed", () => {
    const h = habit({ createdAt: new Date(2026, 6, 21).getTime() });
    const w = completionWindow(h, byDate(completions("h1", ["2026-07-21"])), TODAY, 30);
    expect(w.scheduled).toBe(1);
    expect(w.rate).toBe(1);
  });

  it("gives flexible habits no day-level rate", () => {
    const h = habit({ schedule: { kind: "timesPerWeek", weekdays: [], timesPerWeek: 3 } });
    const w = completionWindow(h, byDate(completions("h1", ["2026-07-20"])), TODAY, 7);
    expect(w.done).toBe(1);
    expect(w.rate).toBeNull();
  });
});
