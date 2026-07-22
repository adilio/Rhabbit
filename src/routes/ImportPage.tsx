import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";
import {
  detectLayout,
  guessColumns,
  parseEventLog,
  parseMatrix,
  readWorkbook,
  sheetRows,
  type ColumnMap,
  type ParseResult,
} from "../lib/importer";
import type { Entry, Habit } from "../lib/types";

type WB = ReturnType<typeof readWorkbook>;

export function ImportPage() {
  const { habits, entriesByKey, commitImport } = useStore();
  const { show } = useToast();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [filename, setFilename] = useState("");
  const [wb, setWb] = useState<WB | null>(null);
  const [sheet, setSheet] = useState("");
  const [colMap, setColMap] = useState<ColumnMap | null>(null);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");

  const rows = useMemo(
    () => (wb && sheet ? sheetRows(wb, sheet) : []),
    [wb, sheet],
  );
  const layout = useMemo(() => (rows.length ? detectLayout(rows) : null), [rows]);

  const result: ParseResult | null = useMemo(() => {
    if (!rows.length || !layout) return null;
    if (layout === "matrix") return parseMatrix(rows);
    return parseEventLog(rows, colMap ?? guessColumns(rows[0]));
  }, [rows, layout, colMap]);

  const plan = useMemo(() => {
    if (!result) return null;
    const existingByName = new Map(
      (habits ?? []).map((h) => [h.name.trim().toLowerCase(), h]),
    );
    const newHabitNames = result.habitNames.filter(
      (n) => !existingByName.has(n.trim().toLowerCase()),
    );
    let duplicates = 0;
    const fresh = result.entries.filter((e) => {
      const h = existingByName.get(e.habitName.trim().toLowerCase());
      if (h && entriesByKey.has(`${h.id}_${e.date}`)) {
        duplicates++;
        return false;
      }
      return true;
    });
    return { newHabitNames, fresh, duplicates, existingByName };
  }, [result, habits, entriesByKey]);

  const loadFile = async (file: File) => {
    setError("");
    try {
      const workbook = readWorkbook(await file.arrayBuffer());
      setWb(workbook);
      setFilename(file.name);
      setSheet(workbook.SheetNames[0]);
      setColMap(null);
    } catch {
      setError("Couldn't read that file. Is it an .xlsx, .xls, or .csv?");
    }
  };

  const commit = async () => {
    if (!result || !plan) return;
    setCommitting(true);
    try {
      const batchId = `imp-${Date.now()}`;
      const now = Date.now();
      const newHabits: Habit[] = plan.newHabitNames.map((name, i) => {
        const values = result.entries.filter(
          (e) => e.habitName === name && e.value !== null && e.value > 1,
        );
        return {
          id: `${batchId}-h${i}`,
          name,
          emoji: "",
          type: values.length >= 3 ? "numeric" : "boolean",
          target: null,
          unit: "",
          schedule: { kind: "daily" as const, weekdays: [], timesPerWeek: 3 },
          timeOfDay: "anytime" as const,
          position: (habits?.length ?? 0) + i,
          pausedUntil: null,
          archivedAt: null,
          createdAt: now,
        };
      });
      const idFor = (name: string): string => {
        const key = name.trim().toLowerCase();
        return (
          plan.existingByName.get(key)?.id ??
          newHabits.find((h) => h.name.trim().toLowerCase() === key)!.id
        );
      };
      // Last write wins within the file for the same habit+day
      const byKey = new Map<string, Entry>();
      for (const e of plan.fresh) {
        if (!e.complete) continue;
        const habitId = idFor(e.habitName);
        byKey.set(`${habitId}_${e.date}`, {
          habitId,
          date: e.date,
          status: "complete",
          value: e.value,
          note: e.note,
          completedAt: null,
          importBatchId: batchId,
        });
      }
      const newEntries = [...byKey.values()];
      await commitImport(
        {
          id: batchId,
          filename,
          importedAt: now,
          entryCount: newEntries.length,
          habitsCreated: newHabits.length,
        },
        newHabits,
        newEntries,
      );
      show(`Imported ${newEntries.length} entries. Undo any time in Settings.`);
      navigate("/settings");
    } catch {
      setError("Import failed part-way. Check Settings → Imports, then try again.");
      setCommitting(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Import a spreadsheet</h1>
      <p className="deck small">
        Bring your habit history from Excel or CSV. Everything is previewed
        before anything is saved, and the whole import can be undone.
      </p>

      {!wb && (
        <div
          className={`drop-zone${dragOver ? " over" : ""}`}
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) void loadFile(f);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && fileInput.current?.click()}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>
            Drop a file here, or tap to choose
          </p>
          <p className="faint small" style={{ margin: "6px 0 0" }}>
            .xlsx · .xls · .csv
          </p>
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void loadFile(f);
            }}
          />
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      {wb && (
        <>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontWeight: 600 }}>{filename}</span>
              <button
                className="button button-ghost button-small"
                onClick={() => {
                  setWb(null);
                  setColMap(null);
                }}
              >
                Choose a different file
              </button>
            </div>
            {wb.SheetNames.length > 1 && (
              <label className="field" style={{ marginTop: 12 }}>
                <span className="field-label">Worksheet</span>
                <select
                  value={sheet}
                  onChange={(e) => {
                    setSheet(e.target.value);
                    setColMap(null);
                  }}
                >
                  {wb.SheetNames.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            )}
            {layout && (
              <p className="muted small" style={{ margin: "10px 0 0" }}>
                Detected layout:{" "}
                <strong>
                  {layout === "matrix"
                    ? "habit grid (habits down, dates across)"
                    : "event log (one row per entry)"}
                </strong>
              </p>
            )}
          </div>

          {layout === "eventLog" && rows.length > 0 && (
            <ColumnMapper
              header={rows[0]}
              map={colMap ?? guessColumns(rows[0])}
              onChange={setColMap}
            />
          )}

          {result && plan && (
            <>
              <div className="card">
                <h2 className="card-title">Preview</h2>
                <div className="stat-grid" style={{ marginBottom: 14 }}>
                  <div className="stat">
                    <div className="stat-value">{plan.fresh.filter((e) => e.complete).length}</div>
                    <div className="stat-label">Entries to import</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">{plan.newHabitNames.length}</div>
                    <div className="stat-label">New habits</div>
                  </div>
                  {plan.duplicates > 0 && (
                    <div className="stat">
                      <div className="stat-value">{plan.duplicates}</div>
                      <div className="stat-label">Already logged (skipped)</div>
                    </div>
                  )}
                  {result.skippedRows > 0 && (
                    <div className="stat">
                      <div className="stat-value">{result.skippedRows}</div>
                      <div className="stat-label">Rows skipped</div>
                    </div>
                  )}
                </div>

                {plan.newHabitNames.length > 0 && (
                  <p className="muted small">
                    New habits: {plan.newHabitNames.join(", ")}
                  </p>
                )}

                {result.warnings.length > 0 && (
                  <details style={{ marginBottom: 12 }}>
                    <summary className="muted small" style={{ cursor: "pointer" }}>
                      {result.warnings.length} warning
                      {result.warnings.length === 1 ? "" : "s"}
                    </summary>
                    <ul className="muted small">
                      {result.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </details>
                )}

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Habit</th>
                        <th>Value</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.fresh
                        .filter((e) => e.complete)
                        .slice(0, 12)
                        .map((e, i) => (
                          <tr key={i}>
                            <td>{e.date}</td>
                            <td>{e.habitName}</td>
                            <td>{e.value ?? "✓"}</td>
                            <td>{e.note}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {plan.fresh.filter((e) => e.complete).length > 12 && (
                  <p className="faint small" style={{ margin: "8px 0 0" }}>
                    …and {plan.fresh.filter((e) => e.complete).length - 12} more
                  </p>
                )}
              </div>

              <div className="action-row" style={{ margin: "16px 0" }}>
                <button
                  className="button button-primary"
                  disabled={committing || plan.fresh.filter((e) => e.complete).length === 0}
                  onClick={() => void commit()}
                >
                  {committing
                    ? "Importing…"
                    : `Import ${plan.fresh.filter((e) => e.complete).length} entries`}
                </button>
                <Link to="/settings" className="button button-ghost">
                  Cancel
                </Link>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

function ColumnMapper({
  header,
  map,
  onChange,
}: {
  header: unknown[];
  map: ColumnMap;
  onChange: (m: ColumnMap) => void;
}) {
  const fields: Array<{ key: keyof ColumnMap; label: string; required?: boolean }> = [
    { key: "habit", label: "Habit name", required: true },
    { key: "date", label: "Date", required: true },
    { key: "status", label: "Completed" },
    { key: "value", label: "Value / duration" },
    { key: "note", label: "Notes" },
  ];
  return (
    <div className="card">
      <h2 className="card-title">Columns</h2>
      <div className="field-row" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {fields.map((f) => (
          <label className="field" key={f.key} style={{ marginBottom: 0 }}>
            <span className="field-label">
              {f.label}
              {f.required ? " *" : ""}
            </span>
            <select
              value={map[f.key] ?? ""}
              onChange={(e) =>
                onChange({
                  ...map,
                  [f.key]: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            >
              <option value="">—</option>
              {header.map((h, i) => (
                <option key={i} value={i}>
                  {String(h || `Column ${i + 1}`)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
