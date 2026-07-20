import { useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";
import { Ring } from "../components/Ring";
import { RabbitMark } from "../components/RabbitMark";
import { IconCheck, IconPlus } from "../components/Icons";
import { HabitEditor } from "../components/HabitEditor";
import { HabitSheet } from "../components/HabitSheet";
import {
  addDays,
  formatLong,
  greeting,
  todayKey,
} from "../lib/dates";
import {
  completionsThisWeek,
  isScheduledOn,
  isStrictlyScheduled,
} from "../lib/schedule";
import {
  allDoneMessage,
  comebackMessage,
  completionMessage,
} from "../lib/messages";
import {
  TIME_OF_DAY_LABELS,
  TIME_OF_DAY_ORDER,
  type Entry,
  type Habit,
} from "../lib/types";

export function Today() {
  const { profile } = useAuth();
  const { habits, entriesByKey, setEntry, clearEntry, loading } = useStore();
  const { show } = useToast();
  const [editing, setEditing] = useState<Habit | "new" | null>(null);
  const [detail, setDetail] = useState<Habit | null>(null);
  const today = todayKey();

  const active = useMemo(
    () => (habits ?? []).filter((h) => isScheduledOn(h, today)),
    [habits, today],
  );

  const entryFor = (h: Habit): Entry | undefined =>
    entriesByKey.get(`${h.id}_${today}`);

  const relevant = active.filter((h) => {
    // Flexible habits leave Today once the weekly quota is met (unless done today)
    if (h.schedule.kind !== "timesPerWeek") return true;
    const e = entryFor(h);
    if (e?.status === "complete") return true;
    return (
      completionsThisWeek(h, today, entriesByKey, profile?.weekStartsOn ?? "sunday") <
      h.schedule.timesPerWeek
    );
  });

  const doneCount = relevant.filter((h) => entryFor(h)?.status === "complete").length;
  const skippedCount = relevant.filter((h) => entryFor(h)?.status === "skipped").length;
  const countable = relevant.length - skippedCount;

  /** Was the most recent strictly-scheduled day (last 14) an unlogged miss? */
  const isComeback = (h: Habit): boolean => {
    for (let i = 1; i <= 14; i++) {
      const d = addDays(today, -i);
      if (!isStrictlyScheduled(h, d)) continue;
      const e = entriesByKey.get(`${h.id}_${d}`);
      if (e?.status === "skipped") continue;
      return e?.status !== "complete";
    }
    return false;
  };

  const complete = async (h: Habit, value?: number) => {
    const prev = entryFor(h);
    const comeback = isComeback(h);
    await setEntry(h.id, today, {
      status: "complete",
      value: value ?? h.target ?? null,
      completedAt: Date.now(),
    });
    const lastOne = doneCount + 1 >= countable && countable > 0;
    show(
      comeback ? comebackMessage() : lastOne ? allDoneMessage() : completionMessage(),
      {
        undo: () => {
          if (prev) void setEntry(h.id, today, prev);
          else void clearEntry(h.id, today);
        },
      },
    );
  };

  const uncomplete = async (h: Habit) => {
    const e = entryFor(h);
    // Numeric habits step back below target instead of wiping progress
    if ((h.type === "numeric" || h.type === "duration") && e?.value != null) {
      await setEntry(h.id, today, {
        status: null,
        value: Math.max(0, Math.min(e.value, (h.target ?? 1) - 1)),
        completedAt: null,
      });
    } else {
      await clearEntry(h.id, today);
    }
  };

  const increment = async (h: Habit, delta: number) => {
    const e = entryFor(h);
    const target = h.target ?? 1;
    const next = Math.max(0, (e?.value ?? 0) + delta);
    if (next >= target && e?.status !== "complete") {
      await complete(h, next);
    } else {
      await setEntry(h.id, today, {
        status: next >= target ? "complete" : null,
        value: next,
        completedAt: next >= target ? Date.now() : null,
      });
    }
  };

  const skip = async (h: Habit) => {
    await setEntry(h.id, today, { status: "skipped", completedAt: null });
    show("Skipped — no guilt, it's not a miss.", { hop: false });
  };

  if (loading) {
    return (
      <div className="screen-center">
        <div className="spinner" role="status" aria-label="Loading" />
      </div>
    );
  }

  return (
    <>
      <div className="today-hero">
        <div>
          <h1 className="today-greeting">
            {greeting(profile?.displayName ?? "friend")}
          </h1>
          <p className="today-date">{formatLong(today)}</p>
          {countable > 0 && (
            <p className="today-summary">
              {doneCount === countable
                ? "All done for today 🎉"
                : `${doneCount} of ${countable} complete`}
            </p>
          )}
        </div>
        <Ring done={doneCount} total={countable} />
      </div>

      {relevant.length === 0 ? (
        <div className="empty">
          <RabbitMark className="empty-mark" />
          <h2>A fresh burrow</h2>
          <p>Add your first habit and take the first hop.</p>
          <button className="button button-primary" onClick={() => setEditing("new")}>
            <IconPlus className="icon-sm" /> Add a habit
          </button>
        </div>
      ) : (
        TIME_OF_DAY_ORDER.map((tod) => {
          const group = relevant.filter((h) => h.timeOfDay === tod);
          if (group.length === 0) return null;
          const groupDone = group.filter(
            (h) => entryFor(h)?.status === "complete",
          ).length;
          return (
            <section key={tod} className="group">
              <p className="group-label">
                <span>{TIME_OF_DAY_LABELS[tod]}</span>
                <span>
                  {groupDone}/{group.length}
                </span>
              </p>
              <div className="habit-list">
                {group.map((h) => (
                  <HabitRow
                    key={h.id}
                    habit={h}
                    entry={entryFor(h)}
                    weekCount={
                      h.schedule.kind === "timesPerWeek"
                        ? completionsThisWeek(
                            h,
                            today,
                            entriesByKey,
                            profile?.weekStartsOn ?? "sunday",
                          )
                        : null
                    }
                    onComplete={() => void complete(h)}
                    onUncomplete={() => void uncomplete(h)}
                    onIncrement={(d) => void increment(h, d)}
                    onOpen={() => setDetail(h)}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}

      {relevant.length > 0 && (
        <button
          className="button button-ghost button-block"
          onClick={() => setEditing("new")}
        >
          <IconPlus className="icon-sm" /> Add a habit
        </button>
      )}

      {editing && (
        <HabitEditor
          habit={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {detail && (
        <HabitSheet
          habit={detail}
          date={today}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEditing(detail);
            setDetail(null);
          }}
          onSkip={() => {
            void skip(detail);
            setDetail(null);
          }}
        />
      )}
    </>
  );
}

function HabitRow({
  habit,
  entry,
  weekCount,
  onComplete,
  onUncomplete,
  onIncrement,
  onOpen,
}: {
  habit: Habit;
  entry: Entry | undefined;
  weekCount: number | null;
  onComplete: () => void;
  onUncomplete: () => void;
  onIncrement: (delta: number) => void;
  onOpen: () => void;
}) {
  const done = entry?.status === "complete";
  const skipped = entry?.status === "skipped";
  const numeric = habit.type === "numeric" || habit.type === "duration";
  const value = entry?.value ?? 0;

  const sub: string[] = [];
  if (numeric && habit.target) {
    sub.push(`${value} / ${habit.target}${habit.unit ? ` ${habit.unit}` : ""}`);
  }
  if (weekCount !== null) {
    sub.push(`${weekCount} of ${habit.schedule.timesPerWeek} this week`);
  }
  if (skipped) sub.push("Skipped today");
  if (habit.type === "avoidance" && !done && !skipped) sub.push("Tap when you've stayed clear");

  return (
    <div className={`habit-row${done ? " done" : ""}${skipped ? " skipped" : ""}`}>
      <button className="habit-main" onClick={onOpen}>
        <p className="habit-name">
          {habit.emoji && <span aria-hidden="true">{habit.emoji} </span>}
          {habit.name}
        </p>
        {(sub.length > 0 || entry?.note) && (
          <p className="habit-sub">
            {sub.join(" · ")}
            {entry?.note && <span className="habit-note-dot">✎</span>}
          </p>
        )}
      </button>
      {numeric && !done && !skipped && (
        <div className="stepper" aria-label={`Adjust ${habit.name}`}>
          <button onClick={() => onIncrement(-1)} disabled={value <= 0} aria-label="Decrease">
            −
          </button>
          <button onClick={() => onIncrement(1)} aria-label="Increase">
            +
          </button>
        </div>
      )}
      <button
        className={`check${done ? " checked" : numeric && value > 0 ? " partial" : ""}`}
        aria-label={done ? `Mark ${habit.name} not done` : `Mark ${habit.name} done`}
        aria-pressed={done}
        onClick={done ? onUncomplete : onComplete}
      >
        {done ? <IconCheck /> : numeric && value > 0 ? `${value}` : <IconCheck />}
      </button>
    </div>
  );
}
