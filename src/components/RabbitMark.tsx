export function RabbitMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g stroke="var(--rabbit-outline, #3a4550)" strokeWidth="1.5">
        <rect fill="var(--rabbit-fur, #cfdfec)" x="20.5" y="4" width="9" height="26" rx="4.5" transform="rotate(-8 25 17)" />
        <rect fill="var(--rabbit-fur, #cfdfec)" x="34.5" y="4" width="9" height="26" rx="4.5" transform="rotate(8 39 17)" />
        <path fill="var(--rabbit-ear, #e8b9bc)" stroke="none" d="M23.4 8.2c1.4-.2 2.8 1 3 2.6l1.5 12.4-4.1.5-1.7-12.3c-.2-1.6.3-3 1.3-3.2Z" />
        <path fill="var(--rabbit-ear, #e8b9bc)" stroke="none" d="M40.6 8.2c-1.4-.2-2.8 1-3 2.6l-1.5 12.4 4.1.5 1.7-12.3c.2-1.6-.3-3-1.3-3.2Z" />
        <circle fill="var(--rabbit-fur, #cfdfec)" cx="32" cy="42" r="16" />
        <path fill="var(--sky, #5e86a4)" stroke="none" d="M17.8 44.5c4.6 5.5 9.4 8.2 14.2 8.2s9.7-2.7 14.2-8.2A16 16 0 0 1 32 58a16 16 0 0 1-14.2-13.5Z" />
      </g>
      <circle cx="26" cy="40" r="2.2" fill="var(--rabbit-outline, #3a4550)" stroke="none" />
      <circle cx="38" cy="40" r="2.2" fill="var(--rabbit-outline, #3a4550)" stroke="none" />
      <path
        d="M29.3 46.8c1.5 1.6 3.9 1.6 5.4 0"
        stroke="var(--rabbit-outline, #3a4550)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
