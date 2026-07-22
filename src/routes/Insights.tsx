import { useMemo, type ReactNode } from "react";
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

      {/* The sentence is the content; "Your week" is only its label. Rendering
          the label in Fraunces 750 over a muted 1rem line inverted the two —
          the same defect .today-summary already fixes on Today, where the
          summary outranks the date and takes full ink at weight 650. */}
      <div className="card">
        <p className="card-lede">
          {week.done} of {week.scheduled || week.done} scheduled habits completed
          {week.scheduled > 0 && week.done >= week.scheduled
            ? " — a clean week so far 🥕"
            : ""}
        </p>
        <p className="card-lede-label">This week</p>
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
              <p>{renderBold(ins.text)}</p>
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

// Render **bold** spans as React nodes so user-controlled habit names are
// never interpolated into raw HTML.
function renderBold(text: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
  );
}

function HabitStatRow({ habit, entries }: { habit: Habit; entries: Entry[] }) {
  const today = todayKey();
  const mine = useMemo(
    () => entries.filter((e) => e.habitId === habit.id),
    [entries, habit.id],
  );
  const stats = useMemo(() => computeStats(habit, mine, today), [habit, mine, today]);
  const byDate = useMemo(() => new Map(mine.map((e) => [e.date, e])), [mine]);

  // Last ~26 weeks, oldest column first, aligned to full weeks. Widened from
  // 18 now that the map fills its row: on desktop the extra weeks use space
  // that was empty, and on a phone the grid still scrolls horizontally.
  const cells = useMemo(() => {
    const days = 26 * 7;
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
        {/* No streak counter. A current-streak tally on every row is a counter
            that resets to zero and means it — the pressure device PRODUCT.md
            exists to argue against, and the same thing already removed from
            the habit sheet. The completion rate beside it describes the same
            history without punishing a gap. */}
        <span className="faint small">
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
