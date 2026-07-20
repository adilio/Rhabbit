export type HabitType = "boolean" | "numeric" | "duration" | "avoidance";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "anytime";

export type ScheduleKind = "daily" | "weekdays" | "timesPerWeek";

export interface Schedule {
  kind: ScheduleKind;
  /** 0 = Sunday … 6 = Saturday. Used when kind === "weekdays". */
  weekdays: number[];
  /** Used when kind === "timesPerWeek". */
  timesPerWeek: number;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  type: HabitType;
  /** Goal for numeric/duration habits (glasses, minutes, …). */
  target: number | null;
  unit: string;
  schedule: Schedule;
  timeOfDay: TimeOfDay;
  position: number;
  /** ISO date key; habit is hidden from Today until this date. */
  pausedUntil: string | null;
  archivedAt: number | null;
  createdAt: number;
}

export type EntryStatus = "complete" | "skipped";

export interface Entry {
  /** Doc id is `${habitId}_${date}` so logging is a same-day upsert. */
  habitId: string;
  /** Local date key, e.g. "2026-07-19". Never shifts with timezone changes. */
  date: string;
  status: EntryStatus | null;
  /** Progress toward target for numeric/duration habits. */
  value: number | null;
  note: string;
  completedAt: number | null;
  importBatchId: string | null;
}

export interface Profile {
  displayName: string;
  email: string;
  timezone: string;
  weekStartsOn: "sunday" | "monday";
  createdAt: number;
}

export interface ImportBatch {
  id: string;
  filename: string;
  importedAt: number;
  entryCount: number;
  habitsCreated: number;
}

export const TIME_OF_DAY_ORDER: TimeOfDay[] = [
  "morning",
  "afternoon",
  "evening",
  "anytime",
];

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  anytime: "Anytime",
};
