import type { Entry, EntryStatus, Habit } from "../src/lib/types";

/** A daily boolean habit created 2026-01-01, unless overridden. */
export function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    name: "Test habit",
    emoji: "✅",
    type: "boolean",
    target: null,
    unit: "",
    schedule: { kind: "daily", weekdays: [], timesPerWeek: 0 },
    timeOfDay: "anytime",
    position: 0,
    pausedUntil: null,
    archivedAt: null,
    createdAt: new Date(2026, 0, 1).getTime(),
    ...overrides,
  };
}

export function entry(
  habitId: string,
  date: string,
  status: EntryStatus | null,
  overrides: Partial<Entry> = {},
): Entry {
  return {
    habitId,
    date,
    status,
    value: null,
    note: "",
    completedAt: status === "complete" ? new Date(`${date}T12:00:00`).getTime() : null,
    importBatchId: null,
    ...overrides,
  };
}

/** Keyed the way the app stores entries: `${habitId}_${date}`. */
export function entryMap(entries: Entry[]): Map<string, Entry> {
  return new Map(entries.map((e) => [`${e.habitId}_${e.date}`, e]));
}

/** Marks `dates` complete for `habitId`. */
export function completions(habitId: string, dates: string[]): Entry[] {
  return dates.map((d) => entry(habitId, d, "complete"));
}
