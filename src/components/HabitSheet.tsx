import { useMemo, useState } from "react";
import { Sheet } from "./Sheet";
import { useStore } from "../lib/store";
import { useToast } from "./Toast";
import { computeStats } from "../lib/stats";
import { scheduleSummary } from "../lib/schedule";
import { addDays, todayKey } from "../lib/dates";
import type { Habit } from "../lib/types";

/** Per-habit detail: note, skip, pause, archive, and a stats snapshot. */
export function HabitSheet({
  habit,
  date,
  onClose,
  onEdit,
  onSkip,
}: {
  habit: Habit;
  date: string;
  onClose: () => void;
  onEdit: () => void;
  onSkip: () => void;
}) {
  const { entries, entriesByKey, setEntry, saveHabit, deleteHabit, clearEntry } =
    useStore();
  const { show } = useToast();
  const entry = entriesByKey.get(`${habit.id}_${date}`);
  const [note, setNote] = useState(entry?.note ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stats = useMemo(
    () =>
      computeStats(
        habit,
        entries.filter((e) => e.habitId === habit.id),
      ),
    [habit, entries],
  );

  const saveNote = async () => {
    await setEntry(habit.id, date, { note: note.trim() });
    onClose();
  };

  const pause = async (days: number) => {
    const prevPaused = habit.pausedUntil;
    await saveHabit({ ...habit, pausedUntil: addDays(todayKey(), days) });
    show(`Paused for ${days === 7 ? "a week" : `${days} days`}. Rest easy.`, {
      hop: false,
      undo: () => void saveHabit({ ...habit, pausedUntil: prevPaused }),
    });
    onClose();
  };

  const archive = async () => {
    await saveHabit({ ...habit, archivedAt: Date.now() });
    show("Archived. Its history is safe.", {
      hop: false,
      undo: () => void saveHabit({ ...habit, archivedAt: null }),
    });
    onClose();
  };

  return (
    <Sheet title={`${habit.emoji ? habit.emoji + " " : ""}${habit.name}`} onClose={onClose}>
      <p className="muted small" style={{ marginTop: -10 }}>
        {scheduleSummary(habit)}
        {habit.target
          ? ` · ${habit.target}${habit.unit ? ` ${habit.unit}` : ""} a day`
          : ""}
      </p>

      {/* Deliberately not a stat grid. Leading this sheet with "Current streak"
          and "Best streak" was a counter that resets to zero and means it —
          the exact pressure device PRODUCT.md names as the primary
          anti-reference — rendered as a hero-metric tile grid DESIGN.md bans.
          A returning user opens this sheet to write a note about their gap.
          It should describe what happened, not grade it. */}
      {stats.totalCompletions > 0 ? (
        <p className="habit-recap">
          Done <strong>{stats.totalCompletions}</strong>{" "}
          {stats.totalCompletions === 1 ? "time" : "times"} so far
          {stats.bestWeekday ? (
            <>
              , most often on <strong>{stats.bestWeekday}s</strong>
            </>
          ) : null}
          .
          {stats.rate30 != null && (
            <>
              {" "}
              That's <strong>{Math.round(stats.rate30 * 100)}%</strong> of the days it
              was due this past month.
            </>
          )}
          {stats.comebacks > 0 && (
            <>
              {" "}
              You've picked it back up <strong>{stats.comebacks}</strong>{" "}
              {stats.comebacks === 1 ? "time" : "times"} after a gap.
            </>
          )}
        </p>
      ) : (
        <p className="habit-recap">
          Nothing logged yet — the first one counts as much as any.
        </p>
      )}

      <label className="field">
        <span className="field-label">Note for today (optional)</span>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything worth remembering?"
        />
      </label>

      {/* Six identical ghost buttons made "Skip today" — the product's flagship
          forgiveness affordance — indistinguishable from "Archive". The two
          decisions a user actually came here for lead; the rest step back. */}
      <div className="sheet-actions">
        <button className="button button-primary" onClick={() => void saveNote()}>
          Save
        </button>
        {entry?.status !== "complete" && entry?.status !== "skipped" && (
          <button className="button button-ghost" onClick={onSkip}>
            Skip today
          </button>
        )}
        {entry?.status === "skipped" && (
          <button
            className="button button-ghost"
            onClick={() => {
              void clearEntry(habit.id, date);
              onClose();
            }}
          >
            Un-skip
          </button>
        )}
      </div>

      <div className="sheet-actions sheet-actions-minor">
        <button className="button button-ghost button-small" onClick={onEdit}>
          Edit habit
        </button>
        <button className="button button-ghost button-small" onClick={() => void pause(7)}>
          Pause a week
        </button>
        <button className="button button-ghost button-small" onClick={() => void archive()}>
          Archive
        </button>
      </div>

      <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
        {confirmDelete ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="small muted">Delete forever, including all history?</span>
            <button
              className="button button-danger button-small"
              onClick={() => {
                void deleteHabit(habit.id);
                // Delete is the one action with no undo — its history is gone.
                // It should at least confirm that it happened.
                show(`"${habit.name}" deleted.`, { hop: false });
                onClose();
              }}
            >
              Yes, delete
            </button>
            <button
              className="button button-ghost button-small"
              onClick={() => setConfirmDelete(false)}
            >
              Keep it
            </button>
          </div>
        ) : (
          <button className="button button-danger button-small" onClick={() => setConfirmDelete(true)}>
            Delete habit…
          </button>
        )}
      </div>
    </Sheet>
  );
}
