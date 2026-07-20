import type { Entry, Habit } from "./types";
import { addDays, weekdayOf, weekStart } from "./dates";

/** Whether a habit is expected on a given local date.
    "timesPerWeek" habits are flexible: they show every day until the weekly
    quota is met, but a quiet day never counts as a miss. */
export function isScheduledOn(habit: Habit, date: string): boolean {
  if (habit.archivedAt) return false;
  if (habit.pausedUntil && date < habit.pausedUntil) return false;
  switch (habit.schedule.kind) {
    case "daily":
      return true;
    case "weekdays":
      return habit.schedule.weekdays.includes(weekdayOf(date));
    case "timesPerWeek":
      return true;
  }
}

/** For flexible habits: completions so far in the week containing `date`. */
export function completionsThisWeek(
  habit: Habit,
  date: string,
  entriesByKey: Map<string, Entry>,
  weekStartsOn: "sunday" | "monday",
): number {
  const start = weekStart(date, weekStartsOn);
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const key = addDays(start, i);
    if (key > date) break;
    const e = entriesByKey.get(`${habit.id}_${key}`);
    if (e?.status === "complete") count++;
  }
  return count;
}

/** A strict miss: scheduled, in the past, and no entry at all.
    Flexible (timesPerWeek) habits only miss when the whole week fell short,
    which we attribute to no single day — so they never produce strict misses. */
export function isStrictlyScheduled(habit: Habit, date: string): boolean {
  if (!isScheduledOn(habit, date)) return false;
  return habit.schedule.kind !== "timesPerWeek";
}

export function scheduleSummary(habit: Habit): string {
  const s = habit.schedule;
  switch (s.kind) {
    case "daily":
      return "Every day";
    case "weekdays": {
      const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      if (s.weekdays.length === 7) return "Every day";
      return s.weekdays
        .slice()
        .sort((a, b) => a - b)
        .map((d) => names[d])
        .join(" · ");
    }
    case "timesPerWeek":
      return s.timesPerWeek === 1 ? "Once a week" : `${s.timesPerWeek}× a week`;
  }
}
