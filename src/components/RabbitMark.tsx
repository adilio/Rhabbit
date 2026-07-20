export function RabbitMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="rabbit-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffa05e" />
          <stop offset="1" stopColor="#f2662d" />
        </linearGradient>
      </defs>
      <g fill="url(#rabbit-g)">
        <rect x="20.5" y="4" width="9" height="26" rx="4.5" transform="rotate(-8 25 17)" />
        <rect x="34.5" y="4" width="9" height="26" rx="4.5" transform="rotate(8 39 17)" />
        <circle cx="32" cy="42" r="16" />
      </g>
      <circle cx="26" cy="40" r="2.2" fill="var(--bg, #0b0d12)" />
      <circle cx="38" cy="40" r="2.2" fill="var(--bg, #0b0d12)" />
      <path
        d="M29.3 46.8c1.5 1.6 3.9 1.6 5.4 0"
        stroke="var(--bg, #0b0d12)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
