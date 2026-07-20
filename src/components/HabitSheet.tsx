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
    await saveHabit({ ...habit, pausedUntil: addDays(todayKey(), days) });
    show(`Paused for ${days === 7 ? "a week" : `${days} days`}. Rest easy.`, { hop: false });
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

      <div className="stat-grid" style={{ margin: "16px 0" }}>
        <div className="stat">
          <div className="stat-value">{stats.currentStreak}</div>
          <div className="stat-label">Current streak</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.bestStreak}</div>
          <div className="stat-label">Best streak</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.totalCompletions}</div>
          <div className="stat-label">Total done</div>
        </div>
        {stats.comebacks > 0 && (
          <div className="stat">
            <div className="stat-value">{stats.comebacks}</div>
            <div className="stat-label">Comebacks 💪</div>
          </div>
        )}
      </div>

      <label className="field">
        <span className="field-label">Note for today (optional)</span>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything worth remembering?"
        />
      </label>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button className="button button-primary" onClick={() => void saveNote()}>
          Save
        </button>
        <button className="button button-ghost" onClick={onEdit}>
          Edit habit
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
        <button className="button button-ghost" onClick={() => void pause(7)}>
          Pause a week
        </button>
        <button className="button button-ghost" onClick={() => void archive()}>
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
