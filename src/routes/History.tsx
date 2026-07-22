import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { IconChevronLeft, IconChevronRight, IconCheck } from "../components/Icons";
import { dateKey, formatShort, monthTitle, todayKey, WEEKDAY_SHORT } from "../lib/dates";
import { isScheduledOn } from "../lib/schedule";
import type { Habit } from "../lib/types";

export function History() {
  const { habits, entriesByKey, setEntry, clearEntry } = useStore();
  const { profile } = useAuth();
  const today = todayKey();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(today);

  const weekStartsOn = profile?.weekStartsOn ?? "sunday";
  const dowOffset = weekStartsOn === "monday" ? 1 : 0;
  const dows = [...WEEKDAY_SHORT.slice(dowOffset), ...WEEKDAY_SHORT.slice(0, dowOffset)];

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const lead = (first.getDay() - dowOffset + 7) % 7;
    const start = new Date(year, month, 1 - lead);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { key: dateKey(d), inMonth: d.getMonth() === month, day: d.getDate() };
    });
  }, [year, month, dowOffset]);

  const dayState = (key: string) => {
    const scheduled = (habits ?? []).filter(
      (h) =>
        isScheduledOn(h, key) &&
        (!h.archivedAt || entriesByKey.has(`${h.id}_${key}`)),
    );
    const done = scheduled.filter(
      (h) => entriesByKey.get(`${h.id}_${key}`)?.status === "complete",
    ).length;
    const skipped = scheduled.filter(
      (h) => entriesByKey.get(`${h.id}_${key}`)?.status === "skipped",
    ).length;
    return { total: scheduled.length - skipped, done, habits: scheduled };
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const sel = dayState(selected);

  return (
    <>
      {/* Picker and detail become side-by-side panes at ≥1180 — see
          .history-panes. Stacked below that, which is correct on a phone.
          The month header lives inside the picker pane so its nav stays with
          the calendar it drives rather than drifting to the shell's edge. */}
      <div className="history-panes">
      <div className="history-cal">
      <div className="cal-head">
        <h1 className="cal-title">{monthTitle(year, month)}</h1>
        <div className="cal-nav">
          <button onClick={prevMonth} aria-label="Previous month">
            <IconChevronLeft />
          </button>
          <button onClick={nextMonth} aria-label="Next month">
            <IconChevronRight />
          </button>
        </div>
      </div>

      <div className="cal-grid">
        {dows.map((d) => (
          <div key={d} className="cal-dow">
            {d}
          </div>
        ))}
        {cells.map((c) => {
          const st = c.key <= today ? dayState(c.key) : { total: 0, done: 0 };
          const frac = st.total > 0 ? st.done / st.total : 0;
          return (
            <button
              key={c.key}
              className={`cal-day${c.inMonth ? "" : " other"}${
                c.key === today ? " today" : ""
              }${c.key === selected ? " selected" : ""}`}
              onClick={() => setSelected(c.key)}
              aria-label={`${c.key}, ${st.done} of ${st.total} complete`}
            >
              <span>{c.day}</span>
              {st.total > 0 && (
                <span className="cal-pips">
                  <span
                    className={`cal-pip${frac >= 1 ? " full" : frac > 0 ? " half" : ""}`}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>
      </div>

      <section className="group">
        <p className="group-label">
          <span>{formatShort(selected)}</span>
          {sel.total > 0 && (
            <span>
              {sel.done}/{sel.total}
            </span>
          )}
        </p>
        {sel.habits.length === 0 ? (
          <p className="muted small">Nothing scheduled this day.</p>
        ) : (
          <div className="habit-list">
            {sel.habits.map((h) => (
              <BackfillRow
                key={h.id}
                habit={h}
                date={selected}
                editable={selected <= today}
                status={entriesByKey.get(`${h.id}_${selected}`)?.status ?? null}
                value={entriesByKey.get(`${h.id}_${selected}`)?.value ?? null}
                onToggle={(next) => {
                  if (next) {
                    void setEntry(h.id, selected, {
                      status: "complete",
                      value: h.target ?? null,
                      completedAt: Date.now(),
                    });
                  } else {
                    void clearEntry(h.id, selected);
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>
      </div>
    </>
  );
}

function BackfillRow({
  habit,
  status,
  value,
  editable,
  onToggle,
}: {
  habit: Habit;
  date: string;
  status: "complete" | "skipped" | null;
  value: number | null;
  editable: boolean;
  onToggle: (next: boolean) => void;
}) {
  const done = status === "complete";
  return (
    <div className={`habit-row${done ? " done" : ""}${status === "skipped" ? " skipped" : ""}`}>
      <div className="habit-main">
        <p className="habit-name">
          {habit.emoji && <span aria-hidden="true">{habit.emoji} </span>}
          {habit.name}
        </p>
        <p className="habit-sub">
          {status === "skipped"
            ? "Skipped"
            : done && habit.target
              ? `${value ?? habit.target} ${habit.unit || ""}`.trim()
              : done
                ? "Done"
                : "Not logged"}
        </p>
      </div>
      {editable && (
        <button
          className={`check${done ? " checked" : ""}`}
          aria-pressed={done}
          aria-label={`${habit.name}: ${done ? "mark not done" : "mark done"}`}
          onClick={() => onToggle(!done)}
        >
          <IconCheck />
        </button>
      )}
    </div>
  );
}
