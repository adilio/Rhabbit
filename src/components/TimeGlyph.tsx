import type { ReactNode } from "react";
import type { TimeOfDay } from "../lib/types";

/**
 * A tiny inline glyph for each time-of-day group — the hour encoded as a
 * mark, not a word. Drawn in the same 1.5px slate outline as the rabbit so
 * it reads as one illustration system. Stroke inherits the label color, so
 * it adapts to theme and stays kin to the group label it sits beside.
 *
 *   morning   → low sun (half disc on a horizon)
 *   afternoon → high sun (full disc, rays)
 *   evening   → crescent moon
 *   anytime   → a loose spiral (whenever)
 */

const PATHS: Record<TimeOfDay, ReactNode> = {
  // Half-disc risen just above a horizon line.
  morning: (
    <>
      <path d="M3 16.5 H21" />
      <path d="M4.8 16.5 A 3.4 3.4 0 0 1 11.6 16.5" />
      <path d="M8.2 11.8 V13.2" />
    </>
  ),
  // Full disc with eight short rays.
  afternoon: (
    <>
      <circle cx="12" cy="10" r="3.1" />
      <path d="M12 4.3 V5.9 M12 14.1 V15.7 M6.3 10 H7.9 M16.1 10 H17.7 M8 6 L9.1 7.1 M14.9 12.9 L16 14 M16 6 L14.9 7.1 M9.1 12.9 L8 14" />
    </>
  ),
  // Crescent — outer arc, inner bite.
  evening: <path d="M16 5.6 A 7.4 7.4 0 1 0 16 16.4 A 5.4 5.4 0 0 1 16 5.6 Z" />,
  // A loose outward spiral.
  anytime: (
    <path d="M13 12 A 1 1 0 0 0 11 12 A 2 2 0 0 0 15 12 A 3 3 0 0 0 9 12 A 4 4 0 0 0 17 12" />
  ),
};

export function TimeGlyph({ time, className }: { time: TimeOfDay; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[time]}
    </svg>
  );
}
