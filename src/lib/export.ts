import type { Entry, Habit, Profile } from "./types";
import { todayKey } from "./dates";

function download(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJson(profile: Profile, habits: Habit[], entries: Entry[]) {
  download(
    `rhabbit-export-${todayKey()}.json`,
    "application/json",
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        profile: { displayName: profile.displayName, weekStartsOn: profile.weekStartsOn },
        habits,
        entries,
      },
      null,
      2,
    ),
  );
}

export function exportCsv(habits: Habit[], entries: Entry[]) {
  const names = new Map(habits.map((h) => [h.id, h.name]));
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const rows = [
    "Date,Habit,Status,Value,Unit,Note",
    ...entries
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
      .map((e) => {
        const h = habits.find((x) => x.id === e.habitId);
        return [
          e.date,
          esc(names.get(e.habitId) ?? e.habitId),
          e.status ?? "",
          e.value ?? "",
          h?.unit ?? "",
          esc(e.note ?? ""),
        ].join(",");
      }),
  ];
  download(`rhabbit-export-${todayKey()}.csv`, "text/csv", rows.join("\n"));
}
