import type { Entry, Habit } from "./types";
import { computeStats, completionRate } from "./stats";
import { addDays, todayKey } from "./dates";
import { isScheduledOn } from "./schedule";

export interface Insight {
  emoji: string;
  text: string;
}

/** Deterministic, plain-language observations. No AI, no judgement. */
export function buildInsights(habits: Habit[], entries: Entry[]): Insight[] {
  const out: Insight[] = [];
  const today = todayKey();
  const active = habits.filter((h) => !h.archivedAt);
  const byHabit = new Map<string, Entry[]>();
  for (const e of entries) {
    const list = byHabit.get(e.habitId) ?? [];
    list.push(e);
    byHabit.set(e.habitId, list);
  }

  const statsFor = active.map((h) => ({
    habit: h,
    stats: computeStats(h, byHabit.get(h.id) ?? [], today),
  }));

  // Personal-best streak in progress
  for (const { habit, stats } of statsFor) {
    if (stats.currentStreak >= 3 && stats.currentStreak === stats.bestStreak) {
      out.push({
        emoji: "🔥",
        text: `**${habit.name}** is on a ${stats.currentStreak}-day streak — your best yet.`,
      });
      break;
    }
  }

  // Comebacks matter more than streaks
  const comebacker = statsFor
    .filter((s) => s.stats.comebacks > 0)
    .sort((a, b) => b.stats.comebacks - a.stats.comebacks)[0];
  if (comebacker) {
    out.push({
      emoji: "💪",
      text: `You've come back to **${comebacker.habit.name}** ${comebacker.stats.comebacks} ${
        comebacker.stats.comebacks === 1 ? "time" : "times"
      } after a gap. Returning matters more than a perfect streak.`,
    });
  }

  // Most consistent habit (30d)
  const consistent = statsFor
    .filter((s) => s.stats.rate30 !== null && s.stats.totalCompletions >= 5)
    .sort((a, b) => (b.stats.rate30 ?? 0) - (a.stats.rate30 ?? 0))[0];
  if (consistent && (consistent.stats.rate30 ?? 0) >= 0.7) {
    out.push({
      emoji: "🌟",
      text: `**${consistent.habit.name}** is your most consistent habit — ${Math.round(
        (consistent.stats.rate30 ?? 0) * 100,
      )}% over the last 30 days.`,
    });
  }

  // Strongest weekday
  const wk = statsFor.find((s) => s.stats.bestWeekday && s.stats.totalCompletions >= 7);
  if (wk) {
    out.push({
      emoji: "📅",
      text: `You complete **${wk.habit.name}** most often on ${wk.stats.bestWeekday}s.`,
    });
  }

  // Trending up: last 7 days vs the 30-day baseline
  for (const { habit } of statsFor) {
    const byDate = new Map((byHabit.get(habit.id) ?? []).map((e) => [e.date, e]));
    const r7 = completionRate(habit, byDate, today, 7);
    const r30 = completionRate(habit, byDate, today, 30);
    if (r7 !== null && r30 !== null && r7 >= r30 + 0.25 && r7 >= 0.5) {
      out.push({
        emoji: "📈",
        text: `**${habit.name}** is trending up — this week is ahead of your monthly pace.`,
      });
      break;
    }
  }

  // A habit that may be scheduled too often
  const struggling = statsFor
    .filter((s) => s.stats.rate30 !== null && s.stats.totalCompletions >= 3)
    .sort((a, b) => (a.stats.rate30 ?? 1) - (b.stats.rate30 ?? 1))[0];
  if (struggling && (struggling.stats.rate30 ?? 1) < 0.35) {
    out.push({
      emoji: "🌱",
      text: `**${struggling.habit.name}** has been tough lately. A lighter schedule might fit better — that's adjusting, not failing.`,
    });
  }

  return out.slice(0, 5);
}

/** This week's scheduled-vs-done summary. */
export function weekSummary(
  habits: Habit[],
  entriesByKey: Map<string, Entry>,
  weekStartHint: string,
): { done: number; scheduled: number } {
  let done = 0;
  let scheduled = 0;
  const today = todayKey();
  for (const h of habits) {
    if (h.archivedAt) continue;
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStartHint, i);
      if (d > today) break;
      const e = entriesByKey.get(`${h.id}_${d}`);
      if (e?.status === "complete") {
        done++;
        scheduled++;
      } else if (e?.status === "skipped") {
        continue;
      } else if (h.schedule.kind === "weekdays" || h.schedule.kind === "daily") {
        if (isScheduledOn(h, d) && d !== today) scheduled++;
      }
    }
  }
  return { done, scheduled };
}
