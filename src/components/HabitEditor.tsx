import { useState } from "react";
import { Sheet } from "./Sheet";
import { useStore } from "../lib/store";
import { WEEKDAY_SHORT } from "../lib/dates";
import {
  TIME_OF_DAY_LABELS,
  TIME_OF_DAY_ORDER,
  type Habit,
  type HabitType,
  type ScheduleKind,
  type TimeOfDay,
} from "../lib/types";

const TEMPLATES: Array<Partial<Habit> & { name: string }> = [
  { name: "Drink water", emoji: "💧", type: "numeric", target: 8, unit: "glasses" },
  { name: "Take vitamins", emoji: "💊", type: "boolean" },
  { name: "Read", emoji: "📖", type: "duration", target: 20, unit: "min" },
  { name: "Walk", emoji: "🚶", type: "boolean" },
  { name: "Stretch", emoji: "🧘", type: "duration", target: 10, unit: "min" },
  { name: "Floss", emoji: "🦷", type: "boolean" },
  { name: "Journal", emoji: "📓", type: "boolean" },
  { name: "No phone in bed", emoji: "📵", type: "avoidance" },
];

const TYPE_LABELS: Record<HabitType, string> = {
  boolean: "Done / not done",
  numeric: "Count a number",
  duration: "Minutes",
  avoidance: "Avoid something",
};

export function HabitEditor({
  habit,
  onClose,
}: {
  habit: Habit | null;
  onClose: () => void;
}) {
  const { habits, saveHabit } = useStore();
  const [name, setName] = useState(habit?.name ?? "");
  const [emoji, setEmoji] = useState(habit?.emoji ?? "");
  const [type, setType] = useState<HabitType>(habit?.type ?? "boolean");
  const [target, setTarget] = useState<string>(habit?.target?.toString() ?? "");
  const [unit, setUnit] = useState(habit?.unit ?? "");
  const [kind, setKind] = useState<ScheduleKind>(habit?.schedule.kind ?? "daily");
  const [weekdays, setWeekdays] = useState<number[]>(
    habit?.schedule.weekdays ?? [1, 2, 3, 4, 5],
  );
  const [timesPerWeek, setTimesPerWeek] = useState(
    habit?.schedule.timesPerWeek ?? 3,
  );
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(
    habit?.timeOfDay ?? "anytime",
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [applied, setApplied] = useState<string | null>(null);

  const numeric = type === "numeric" || type === "duration";

  const applyTemplate = (t: Partial<Habit> & { name: string }) => {
    setApplied(t.name);
    setName(t.name);
    setEmoji(t.emoji ?? "");
    setType((t.type as HabitType) ?? "boolean");
    setTarget(t.target?.toString() ?? "");
    setUnit(t.unit ?? (t.type === "duration" ? "min" : ""));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (kind === "weekdays" && weekdays.length === 0) {
      setError("Pick at least one day.");
      return;
    }
    const parsedTarget = numeric ? Number(target) || null : null;
    if (numeric && (!parsedTarget || parsedTarget < 1)) {
      setError("Set a target of at least 1.");
      return;
    }
    setSaving(true);
    try {
      await saveHabit({
        id: habit?.id,
        name: name.trim(),
        emoji,
        type,
        target: parsedTarget,
        unit: type === "duration" && !unit ? "min" : unit.trim(),
        schedule: { kind, weekdays, timesPerWeek },
        timeOfDay,
        position: habit?.position ?? (habits?.length ?? 0),
        pausedUntil: habit?.pausedUntil ?? null,
        archivedAt: habit?.archivedAt ?? null,
        createdAt: habit?.createdAt ?? Date.now(),
      });
      onClose();
    } catch {
      setError("Couldn't save. Check your connection and try again.");
      setSaving(false);
    }
  };

  return (
    <Sheet title={habit ? "Edit habit" : "New habit"} onClose={onClose}>
      <form onSubmit={submit}>
        {!habit && (
          <div className="field">
            <span className="field-label">Quick start</span>
            <div className="seg">
              {TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  className={`chip${applied === t.name ? " on" : ""}`}
                  aria-pressed={applied === t.name}
                  onClick={() => applyTemplate(t)}
                >
                  {t.emoji} {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field-row">
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="field-label">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setApplied(null);
                setName(e.target.value);
              }}
              placeholder="e.g. Drink water"
              required
            />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="field-label">Emoji (optional)</span>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
              placeholder="💧"
            />
          </label>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <span className="field-label">Type</span>
          <div className="seg">
            {(Object.keys(TYPE_LABELS) as HabitType[]).map((t) => (
              <button
                key={t}
                type="button"
                className={type === t ? "on" : ""}
                onClick={() => setType(t)}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          {type === "avoidance" && (
            <p className="form-hint">
              Tap it at the end of the day when you stayed clear.
            </p>
          )}
        </div>

        {numeric && (
          <div className="field-row">
            <label className="field" style={{ marginBottom: 0 }}>
              <span className="field-label">Daily target</span>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={type === "duration" ? "20" : "8"}
                required
              />
            </label>
            <label className="field" style={{ marginBottom: 0 }}>
              <span className="field-label">Unit</span>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={type === "duration" ? "min" : "glasses"}
              />
            </label>
          </div>
        )}

        <div className="field" style={{ marginTop: 16 }}>
          <span className="field-label">Schedule</span>
          <div className="seg">
            <button type="button" className={kind === "daily" ? "on" : ""} onClick={() => setKind("daily")}>
              Every day
            </button>
            <button type="button" className={kind === "weekdays" ? "on" : ""} onClick={() => setKind("weekdays")}>
              Certain days
            </button>
            <button type="button" className={kind === "timesPerWeek" ? "on" : ""} onClick={() => setKind("timesPerWeek")}>
              Times per week
            </button>
          </div>
        </div>

        {kind === "weekdays" && (
          <div className="field">
            <div className="day-picker" role="group" aria-label="Days of week">
              {WEEKDAY_SHORT.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  className={weekdays.includes(i) ? "on" : ""}
                  aria-pressed={weekdays.includes(i)}
                  onClick={() =>
                    setWeekdays((w) =>
                      w.includes(i) ? w.filter((x) => x !== i) : [...w, i],
                    )
                  }
                >
                  {d[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {kind === "timesPerWeek" && (
          <label className="field">
            <span className="field-label">How many times a week?</span>
            <input
              type="number"
              min="1"
              max="7"
              inputMode="numeric"
              value={timesPerWeek}
              onChange={(e) =>
                setTimesPerWeek(Math.max(1, Math.min(7, Number(e.target.value) || 1)))
              }
            />
            <p className="form-hint">
              Any days you like — no fixed weekdays, no guilt about which ones.
            </p>
          </label>
        )}

        <div className="field">
          <span className="field-label">Part of the day</span>
          <div className="seg">
            {TIME_OF_DAY_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                className={timeOfDay === t ? "on" : ""}
                onClick={() => setTimeOfDay(t)}
              >
                {TIME_OF_DAY_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        <button className="button button-primary button-block" disabled={saving}>
          {saving ? "Saving…" : habit ? "Save changes" : "Add habit"}
        </button>
      </form>
    </Sheet>
  );
}
