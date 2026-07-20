export function Ring({
  done,
  total,
  size = 72,
}: {
  done: number;
  total: number;
  size?: number;
}) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? done / total : 0;
  const complete = total > 0 && done >= total;
  return (
    <div
      className="ring"
      role="img"
      aria-label={`${done} of ${total} habits complete`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size}>
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className={`ring-fill${complete ? " ring-done" : ""}`}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
        />
      </svg>
      <span className="ring-label">
        {complete ? "🥕" : `${done}/${total}`}
      </span>
    </div>
  );
}
