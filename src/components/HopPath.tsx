import { useEffect, useRef } from "react";
import { RabbitMark } from "./RabbitMark";

/**
 * The hop path — Rhabbit's signature progress element.
 *
 * A short trail of stepping stones, one per habit due today (in schedule
 * order). The rabbit stands on the furthest stone it has reached and hops
 * forward as habits are checked off, reaching the carrot when the day is done.
 * Replaces the old score-style ring: progress here reads as a journey, not a
 * meter. Each stone *is* a specific habit, so the path doubles as a legend for
 * what's left — lighting a stone means that habit is done, not merely that
 * some habit is.
 */

const U = 46; // spacing between landings, in viewBox units
const EDGE = 26; // left/right padding
const BASE = 70; // stone baseline (y)
const H = 88; // viewBox height — headroom above BASE so the rabbit never clips
const MIN_UNIT = 30; // px floor per landing, so long paths scroll instead of vanishing

export interface Stone {
  id: string;
  label: string;
  done: boolean;
}

export function HopPath({ stones }: { stones: Stone[] }) {
  const bobRef = useRef<HTMLDivElement>(null);
  const rabbitRef = useRef<HTMLDivElement>(null);
  const total = stones.length;
  const done = stones.filter((s) => s.done).length;
  const prevDone = useRef(done);

  // Landings: index 0 = start burrow, 1..total = stones, total+1 = carrot.
  const slots = total + 2;
  const W = EDGE * 2 + (slots - 1) * U;
  const x = (i: number) => EDGE + i * U;

  const complete = total > 0 && done >= total;
  // The rabbit stands on the furthest stone it has reached, not on a count —
  // with per-habit stones those differ (habit 3 done, habits 1-2 not).
  let furthest = 0;
  stones.forEach((s, i) => {
    if (s.done) furthest = i + 1;
  });
  // Once the day is done it settles just short of the carrot so both stay visible.
  const rabbitX = complete ? (x(total) + x(total + 1)) / 2 : x(furthest);

  // Hop: a vertical bob on each move. Horizontal glide is the CSS transition on
  // `left`; together they arc. Reduced-motion users get neither (the global
  // reset zeroes the transition; matchMedia gates the bob).
  useEffect(() => {
    if (prevDone.current === done) return;
    const forward = done > prevDone.current;
    prevDone.current = done;
    // Keep the rabbit on screen when the path is long enough to scroll.
    rabbitRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
    const el = bobRef.current;
    if (!el || !forward || !("animate" in el)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(
      [
        { transform: "translateY(0)" },
        { transform: "translateY(-15px)" },
        { transform: "translateY(0)" },
      ],
      { duration: 260, easing: "cubic-bezier(0.33, 0, 0.2, 1)" },
    );
  }, [done]);

  const remaining = stones.filter((s) => !s.done).map((s) => s.label);
  const label = complete
    ? `Habit journey complete — the rabbit reached the carrot, all ${total} done.`
    : `Habit journey: ${done} of ${total} done. Still to go: ${remaining.join(", ")}.`;

  return (
    <div className={`hoppath${complete ? " is-complete" : ""}`} role="img" aria-label={label}>
      <div className="hoppath-frame">
        {/* Inner box is exactly the path's own width, so the rabbit's percentage
            offsets resolve against the rendered path rather than the frame. */}
        <div
          className="hoppath-inner"
          style={{ width: W, maxWidth: "100%", minWidth: Math.min(W, slots * MIN_UNIT) }}
        >
          <svg
            className="hoppath-track"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            {/* Trail line connecting burrow → stones → carrot */}
            <line
              className="hoppath-trail"
              x1={x(0)}
              y1={BASE}
              x2={x(total + 1)}
              y2={BASE}
            />

            {/* Start burrow */}
            <ellipse className="hoppath-burrow" cx={x(0)} cy={BASE} rx={9} ry={5} />

            {/* Stones — one per habit, lit when *that* habit is complete */}
            {stones.map((s, i) => (
              <g key={s.id} className={`hoppath-stone${s.done ? " is-lit" : ""}`}>
                <ellipse cx={x(i + 1)} cy={BASE} rx={11} ry={6.5} />
                {s.done && (
                  <path
                    className="hoppath-check"
                    d={`M ${x(i + 1) - 3.5} ${BASE} l 2.4 2.4 l 4.6 -5`}
                    fill="none"
                  />
                )}
              </g>
            ))}

            {/* Carrot at the end. Outer group positions it; the inner group
                carries the completion pop (a CSS transform there can't clobber
                this translate). */}
            <g transform={`translate(${x(total + 1)}, ${BASE})`}>
              <g className="hoppath-carrot">
                <path
                  className="hoppath-carrot-body"
                  d="M 0 9 C -4 4 -4 -2 0 -3 C 4 -2 4 4 0 9 Z"
                />
                <path
                  className="hoppath-carrot-leaf"
                  d="M 0 -3 l -3.5 -5 M 0 -3 l 0 -6 M 0 -3 l 3.5 -5"
                  fill="none"
                />
              </g>
            </g>
          </svg>

          {/* Rabbit overlay — percentages resolve against .hoppath-inner, which
              is the path's own box, so it lands on its stone at every width. */}
          <div
            ref={rabbitRef}
            className="hoppath-rabbit"
            style={{
              left: `${(rabbitX / W) * 100}%`,
              top: `${(BASE / H) * 100}%`,
              width: `${(38 / W) * 100}%`,
            }}
          >
            <div ref={bobRef} className="hoppath-rabbit-bob">
              <RabbitMark className="hoppath-rabbit-mark" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
