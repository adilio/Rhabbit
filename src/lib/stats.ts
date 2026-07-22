import type { Entry, Habit } from "./types";
import { addDays, todayKey, weekdayOf, WEEKDAY_LONG } from "./dates";
import { isScheduledOn, isStrictlyScheduled } from "./schedule";

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  rate7: number | null;
  rate30: number | null;
  rate90: number | null;
  completed30: number;
  scheduled30: number;
  totalCompletions: number;
  comebacks: number;
  bestWeekday: string | null;
}

/** Streaks count scheduled days only; skipped days and unscheduled days are
    neutral — they neither extend nor break a streak. Forgiveness by design. */
export function computeStats(
  habit: Habit,
  entries: Entry[],
  today = todayKey(),
): HabitStats {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const start = habit.createdAt
    ? earliest(entries, habit, today)
    : today;

  let current = 0;
  let best = 0;
  let run = 0;
  let total = 0;
  let comebacks = 0;
  let missRun = 0;
  const weekdayHits = new Array(7).fill(0);

  for (let d = start; d <= today; d = addDays(d, 1)) {
    const e = byDate.get(d);
    if (e?.status === "complete") {
      total++;
      weekdayHits[weekdayOf(d)]++;
      if (missRun > 0) comebacks++;
      missRun = 0;
      run++;
      best = Math.max(best, run);
      continue;
    }
    if (e?.status === "skipped" || !isStrictlyScheduled(habit, d)) continue;
    if (d === today) continue; // today isn't a miss yet
    run = 0;
    missRun++;
  }
  current = run;

  const bestIdx = weekdayHits.indexOf(Math.max(...weekdayHits));
  const month = completionWindow(habit, byDate, today, 30);
  return {
    currentStreak: current,
    bestStreak: best,
    rate7: completionRate(habit, byDate, today, 7),
    rate30: month.rate,
    rate90: completionRate(habit, byDate, today, 90),
    completed30: month.done,
    scheduled30: month.scheduled,
    totalCompletions: total,
    comebacks,
    bestWeekday: total > 0 ? WEEKDAY_LONG[bestIdx] : null,
  };
}

function earliest(entries: Entry[], habit: Habit, today: string): string {
  let min = today;
  for (const e of entries) if (e.date < min) min = e.date;
  const created = new Date(habit.createdAt);
  const createdKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
  return createdKey < min ? createdKey : min;
}

function habitStartKey(habit: Habit): string {
  const created = new Date(habit.createdAt);
  return `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
}

export interface CompletionWindow {
  done: number;
  scheduled: number;
  rate: number | null;
}

/** Completed ÷ scheduled over the trailing window. Skips don't count against. */
export function completionRate(
  habit: Habit,
  byDate: Map<string, Entry>,
  today: string,
  days: number,
): number | null {
  return completionWindow(habit, byDate, today, days).rate;
}

/** Counts only the part of a trailing window in which the habit existed. */
export function completionWindow(
  habit: Habit,
  byDate: Map<string, Entry>,
  today: string,
  days: number,
): CompletionWindow {
  let scheduled = 0;
  let done = 0;
  const started = habitStartKey(habit);
  if (habit.schedule.kind === "timesPerWeek") {
    for (let i = 0; i < days; i++) {
      const d = addDays(today, -i);
      if (d < started) continue;
      if (byDate.get(d)?.status === "complete") done++;
    }
    // Flexible weekly habits do not have a truthful day-level denominator.
    return { done, scheduled: 0, rate: null };
  }
  for (let i = 0; i < days; i++) {
    const d = addDays(today, -i);
    if (d < started) continue;
    const e = byDate.get(d);
    if (e?.status === "skipped") continue;
    if (e?.status === "complete") {
      scheduled++;
      done++;
    } else if (isScheduledOn(habit, d) && d !== today) {
      scheduled++;
    }
  }
  return {
    done,
    scheduled,
    rate: scheduled === 0 ? null : done / scheduled,
  };
}
