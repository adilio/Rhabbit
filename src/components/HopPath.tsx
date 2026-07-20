import { useEffect, useRef } from "react";
import { RabbitMark } from "./RabbitMark";

/**
 * The hop path — Rhabbit's signature progress element.
 *
 * A short trail of stepping stones, one per habit due today (in schedule
 * order). The rabbit stands on its most recently completed stone and hops
 * forward as habits are checked off, reaching the carrot when the day is done.
 * Replaces the old score-style ring: progress here reads as a journey, not a
 * meter. Each stone is a habit, so the path doubles as a progress legend.
 */

const U = 46; // spacing between landings, in viewBox units
const EDGE = 26; // left/right padding
const BASE = 50; // stone baseline (y)
const H = 72; // viewBox height

export function HopPath({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  const bobRef = useRef<HTMLDivElement>(null);
  const prevDone = useRef(done);

  // Landings: index 0 = start burrow, 1..total = stones, total+1 = carrot.
  const slots = total + 2;
  const W = EDGE * 2 + (slots - 1) * U;
  const x = (i: number) => EDGE + i * U;

  const complete = total > 0 && done >= total;
  // Rabbit sits on its last completed stone (x(done)); once the day is done it
  // settles just short of the carrot so both stay visible.
  const rabbitX = complete ? (x(total) + x(total + 1)) / 2 : x(done);

  // Hop: a vertical bob on each move. Horizontal glide is the CSS transition on
  // `left`; together they arc. Reduced-motion users get neither (the global
  // reset zeroes the transition; matchMedia gates the bob).
  useEffect(() => {
    if (prevDone.current === done) return;
    const forward = done > prevDone.current;
    prevDone.current = done;
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

  const remaining = Math.max(0, total - done);
  const label = complete
    ? `Habit journey complete — the rabbit reached the carrot, all ${total} done.`
    : `Habit journey: ${done} of ${total} done, ${remaining} ${
        remaining === 1 ? "stone" : "stones"
      } to the carrot.`;

  return (
    <div className={`hoppath${complete ? " is-complete" : ""}`} role="img" aria-label={label}>
      <div className="hoppath-frame">
        <svg
          className="hoppath-track"
          viewBox={`0 0 ${W} ${H}`}
          style={{ maxWidth: W }}
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

          {/* Stones — one per habit, lit as it's completed */}
          {Array.from({ length: total }, (_, i) => {
            const lit = i < done;
            return (
              <g key={i} className={`hoppath-stone${lit ? " is-lit" : ""}`}>
                <ellipse cx={x(i + 1)} cy={BASE} rx={11} ry={6.5} />
                {lit && (
                  <path
                    className="hoppath-check"
                    d={`M ${x(i + 1) - 3.5} ${BASE} l 2.4 2.4 l 4.6 -5`}
                    fill="none"
                  />
                )}
              </g>
            );
          })}

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

        {/* Rabbit overlay — positioned by percentage so it tracks the scaled SVG */}
        <div
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
  );
}
