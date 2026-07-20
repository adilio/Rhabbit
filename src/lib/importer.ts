import * as XLSX from "xlsx";
import { dateKey } from "./dates";

/** Deterministic spreadsheet parsing for habit history.
    Two layouts are recognized:
      event-log:  Date | Habit | Complete | Value | Notes
      matrix:     Habit | Jul 1 | Jul 2 | …  (✓ / numbers in cells)      */

export type Layout = "eventLog" | "matrix";

export interface ParsedEntry {
  habitName: string;
  date: string;
  complete: boolean;
  value: number | null;
  note: string;
}

export interface ParseResult {
  layout: Layout;
  entries: ParsedEntry[];
  habitNames: string[];
  warnings: string[];
  skippedRows: number;
}

export interface ColumnMap {
  habit: number | null;
  date: number | null;
  status: number | null;
  value: number | null;
  note: number | null;
}

const HEADER_SYNONYMS: Record<keyof ColumnMap, string[]> = {
  habit: ["habit", "habitname", "name", "activity", "routine", "goal", "task"],
  date: ["date", "day", "when"],
  status: ["completed", "complete", "done", "status", "check", "checked"],
  value: ["value", "amount", "count", "duration", "minutes", "qty", "quantity", "number"],
  note: ["notes", "note", "comments", "comment", "remarks"],
};

const COMPLETE_VALUES = new Set([
  "✓", "✔", "✅", "x", "yes", "y", "done", "complete", "completed", "1", "true",
]);
const INCOMPLETE_VALUES = new Set([
  "", "no", "n", "0", "false", "missed", "incomplete", "○", "-", "—",
]);

function norm(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function readWorkbook(buf: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(buf, { cellDates: true });
}

export function sheetRows(wb: XLSX.WorkBook, sheetName: string): unknown[][] {
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    blankrows: false,
  });
}

function parseDateCell(cell: unknown, warnings: string[], where: string): string | null {
  if (cell instanceof Date && !isNaN(cell.getTime())) return dateKey(cell);
  const s = String(cell ?? "").trim();
  if (!s) return null;
  // ISO-ish (2026-07-01, 2026/07/01)
  const iso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  // "Jul 1", "July 1", "Jul 1 2026", "1 Jul"
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    if (!/\d{4}/.test(s)) {
      parsed.setFullYear(new Date().getFullYear());
      warnings.push(`${where}: "${s}" has no year — assumed ${parsed.getFullYear()}.`);
    }
    return dateKey(parsed);
  }
  return null;
}

/** Guess column meanings from a header row. */
export function guessColumns(header: unknown[]): ColumnMap {
  const map: ColumnMap = { habit: null, date: null, status: null, value: null, note: null };
  header.forEach((cell, i) => {
    const n = norm(cell);
    if (!n) return;
    for (const key of Object.keys(HEADER_SYNONYMS) as (keyof ColumnMap)[]) {
      if (map[key] === null && HEADER_SYNONYMS[key].includes(n)) {
        map[key] = i;
        return;
      }
    }
  });
  return map;
}

export function detectLayout(rows: unknown[][]): Layout {
  if (rows.length === 0) return "eventLog";
  const header = rows[0];
  const guessed = guessColumns(header);
  if (guessed.date !== null && guessed.habit !== null) return "eventLog";
  // Matrix: ≥2 trailing header cells parse as dates
  const w: string[] = [];
  const dateish = header.slice(1).filter((c) => parseDateCell(c, w, "") !== null).length;
  if (dateish >= 2) return "matrix";
  return "eventLog";
}

export function parseEventLog(rows: unknown[][], map: ColumnMap): ParseResult {
  const warnings: string[] = [];
  const entries: ParsedEntry[] = [];
  let skipped = 0;
  if (map.habit === null || map.date === null) {
    return {
      layout: "eventLog",
      entries: [],
      habitNames: [],
      warnings: ["Pick which columns hold the habit name and the date."],
      skippedRows: rows.length - 1,
    };
  }
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = String(row[map.habit] ?? "").trim();
    const date = parseDateCell(row[map.date], warnings, `Row ${r + 1}`);
    if (!name || !date) {
      if (row.some((c) => String(c ?? "").trim() !== "")) {
        skipped++;
        if (!name) warnings.push(`Row ${r + 1}: no habit name — skipped.`);
        else warnings.push(`Row ${r + 1}: couldn't read the date — skipped.`);
      }
      continue;
    }
    const rawVal = map.value !== null ? row[map.value] : "";
    const value =
      typeof rawVal === "number"
        ? rawVal
        : /^\d+(\.\d+)?$/.test(String(rawVal).trim())
          ? Number(rawVal)
          : null;
    let complete: boolean;
    if (map.status !== null) {
      const s = norm(row[map.status]);
      if (COMPLETE_VALUES.has(s) || COMPLETE_VALUES.has(String(row[map.status]).trim())) {
        complete = true;
      } else if (INCOMPLETE_VALUES.has(s)) {
        complete = false;
      } else {
        complete = s !== "";
        if (s) warnings.push(`Row ${r + 1}: unrecognized status "${row[map.status]}" — treated as complete.`);
      }
    } else {
      complete = value !== null ? value > 0 : true;
    }
    entries.push({
      habitName: name,
      date,
      complete,
      value,
      note: map.note !== null ? String(row[map.note] ?? "").trim() : "",
    });
  }
  return {
    layout: "eventLog",
    entries,
    habitNames: [...new Set(entries.map((e) => e.habitName))],
    warnings: warnings.slice(0, 20),
    skippedRows: skipped,
  };
}

export function parseMatrix(rows: unknown[][]): ParseResult {
  const warnings: string[] = [];
  const entries: ParsedEntry[] = [];
  let skipped = 0;
  const header = rows[0] ?? [];
  const dateCols: Array<{ col: number; date: string }> = [];
  header.slice(1).forEach((c, i) => {
    const d = parseDateCell(c, warnings, `Column ${i + 2}`);
    if (d) dateCols.push({ col: i + 1, date: d });
  });
  if (dateCols.length === 0) {
    return {
      layout: "matrix",
      entries: [],
      habitNames: [],
      warnings: ["No date columns found in the first row."],
      skippedRows: rows.length - 1,
    };
  }
  for (let r = 1; r < rows.length; r++) {
    const name = String(rows[r][0] ?? "").trim();
    if (!name) {
      if (rows[r].some((c) => String(c ?? "").trim() !== "")) skipped++;
      continue;
    }
    for (const { col, date } of dateCols) {
      const cell = rows[r][col];
      const raw = String(cell ?? "").trim();
      if (raw === "") continue;
      const numeric =
        typeof cell === "number" ? cell : /^\d+(\.\d+)?$/.test(raw) ? Number(raw) : null;
      if (numeric !== null) {
        if (numeric > 0) {
          entries.push({ habitName: name, date, complete: true, value: numeric, note: "" });
        }
      } else if (COMPLETE_VALUES.has(norm(cell)) || COMPLETE_VALUES.has(raw)) {
        entries.push({ habitName: name, date, complete: true, value: null, note: "" });
      } else if (!INCOMPLETE_VALUES.has(norm(cell))) {
        warnings.push(`"${name}" on ${date}: unrecognized "${raw}" — ignored.`);
      }
    }
  }
  return {
    layout: "matrix",
    entries,
    habitNames: [...new Set(entries.map((e) => e.habitName))],
    warnings: warnings.slice(0, 20),
    skippedRows: skipped,
  };
}
