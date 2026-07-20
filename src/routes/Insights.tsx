import { useMemo } from "react";
import { useAuth } from "../lib/auth";
import { useStore } from "../lib/store";
import { buildInsights, weekSummary } from "../lib/insights";
import { computeStats } from "../lib/stats";
import { addDays, todayKey, weekStart } from "../lib/dates";
import { RabbitMark } from "../components/RabbitMark";
import type { Entry, Habit } from "../lib/types";

export function Insights() {
  const { profile } = useAuth();
  const { habits, entries, entriesByKey, loading } = useStore();
  const today = todayKey();
  const active = (habits ?? []).filter((h) => !h.archivedAt);

  const insights = useMemo(
    () => buildInsights(habits ?? [], entries),
    [habits, entries],
  );

  const week = useMemo(
    () =>
      weekSummary(
        habits ?? [],
        entriesByKey,
        weekStart(today, profile?.weekStartsOn ?? "sunday"),
      ),
    [habits, entriesByKey, today, profile],
  );

  if (loading) {
    return (
      <div className="screen-center">
        <div className="spinner" role="status" aria-label="Loading" />
      </div>
    );
  }

  if (active.length === 0) {
    return (
      <div className="empty">
        <RabbitMark className="empty-mark" />
        <h2>No trails yet</h2>
        <p>Once you log a few days, insights will sprout here.</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="page-title">Progress</h1>

      <div className="card">
        <h2 className="card-title">Your week</h2>
        <p className="muted" style={{ margin: 0 }}>
          {week.done} of {week.scheduled || week.done} scheduled habits completed
          {week.scheduled > 0 && week.done >= week.scheduled
            ? " — a clean week so far 🥕"
            : ""}
        </p>
      </div>

      {insights.length > 0 && (
        <section className="group">
          <p className="group-label">
            <span>Noticed lately</span>
          </p>
          {insights.map((ins, i) => (
            <div key={i} className="insight">
              <span className="insight-emoji" aria-hidden="true">
                {ins.emoji}
              </span>
              <p dangerouslySetInnerHTML={{ __html: bold(ins.text) }} />
            </div>
          ))}
        </section>
      )}

      <section className="group">
        <p className="group-label">
          <span>Habits</span>
        </p>
        <div className="habit-list">
          {active.map((h) => (
            <HabitStatRow key={h.id} habit={h} entries={entries} />
          ))}
        </div>
      </section>
    </>
  );
}

function bold(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function HabitStatRow({ habit, entries }: { habit: Habit; entries: Entry[] }) {
  const today = todayKey();
  const mine = useMemo(
    () => entries.filter((e) => e.habitId === habit.id),
    [entries, habit.id],
  );
  const stats = useMemo(() => computeStats(habit, mine, today), [habit, mine, today]);
  const byDate = useMemo(() => new Map(mine.map((e) => [e.date, e])), [mine]);

  // Last ~18 weeks, oldest column first, aligned to full weeks
  const cells = useMemo(() => {
    const days = 18 * 7;
    const start = addDays(today, -(days - 1));
    return Array.from({ length: days }, (_, i) => {
      const d = addDays(start, i);
      const e = byDate.get(d);
      if (e?.status === "complete") {
        const frac =
          habit.target && e.value != null ? Math.min(1, e.value / habit.target) : 1;
        return frac >= 1 ? "l3" : frac >= 0.5 ? "l2" : "l1";
      }
      if (e?.status === "skipped") return "skip";
      return "";
    });
  }, [byDate, habit.target, today]);

  return (
    <div className="habit-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <p className="habit-name" style={{ flex: 1 }}>
          {habit.emoji && <span aria-hidden="true">{habit.emoji} </span>}
          {habit.name}
        </p>
        <span className="faint small">
          {stats.currentStreak > 0 && `🔥 ${stats.currentStreak} · `}
          {stats.rate30 !== null ? `${Math.round(stats.rate30 * 100)}% this month` : "New"}
        </span>
      </div>
      <div className="heatmap" aria-label={`${habit.name} history heatmap`}>
        {cells.map((c, i) => (
          <span key={i} className={`heat-cell ${c}`} />
        ))}
      </div>
    </div>
  );
}
