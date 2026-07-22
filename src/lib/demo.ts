import { addDays, todayKey } from "./dates";
import type { Entry, Habit, Profile } from "./types";

export const isDemoMode =
  import.meta.env.DEV && new URLSearchParams(window.location.search).get("demo") === "1";

export const demoProfile: Profile = {
  displayName: "Adil",
  email: "demo@rhabbit.local",
  timezone: "America/Vancouver",
  weekStartsOn: "monday",
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 80,
};

export const demoHabits: Habit[] = [
  habit("water", "Drink water", "💧", "numeric", 8, "glasses", "morning", 0),
  habit("walk", "Morning walk", "🌿", "boolean", null, "", "morning", 1),
  habit("read", "Read for 20 minutes", "📚", "duration", 20, "min", "evening", 2),
  habit("unplug", "No phone in bed", "🌙", "avoidance", null, "", "evening", 3),
];

export const demoEntries: Entry[] = buildEntries();

function habit(
  id: string,
  name: string,
  emoji: string,
  type: Habit["type"],
  target: number | null,
  unit: string,
  timeOfDay: Habit["timeOfDay"],
  position: number,
): Habit {
  return {
    id, name, emoji, type, target, unit, timeOfDay, position,
    schedule: { kind: "daily", weekdays: [], timesPerWeek: 7 },
    pausedUntil: null, archivedAt: null, createdAt: Date.now() - 80 * 86_400_000,
  };
}

function buildEntries(): Entry[] {
  const entries: Entry[] = [];
  const today = todayKey();
  for (let offset = 0; offset < 56; offset++) {
    const date = addDays(today, -offset);
    demoHabits.forEach((habit, index) => {
      const complete = offset === 0 ? index === 1 || index === 3 : (offset + index * 2) % 7 < 5;
      const partialToday = offset === 0 && index === 0;
      if (!complete && !partialToday) return;
      entries.push({
        habitId: habit.id,
        date,
        status: complete ? "complete" : null,
        value: partialToday ? 5 : habit.target,
        note: offset === 1 && index === 2 ? "A few chapters before bed" : "",
        completedAt: complete ? Date.now() - offset * 86_400_000 : null,
        importBatchId: null,
      });
    });
  }
  return entries;
}
