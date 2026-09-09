export function Football({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <defs>
        <linearGradient id="pigskin-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0891b" />
          <stop offset="100%" stopColor="#8a4b06" />
        </linearGradient>
      </defs>
      <ellipse
        cx="12"
        cy="12"
        rx="10.5"
        ry="6.4"
        transform="rotate(-45 12 12)"
        fill="url(#pigskin-gradient)"
      />
      <g
        stroke="var(--chalk)"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.95"
      >
        <path d="M8.4 15.6 15.6 8.4" />
        <path d="M9.7 12.7 11.3 14.3" />
        <path d="M11.2 11.2 12.8 12.8" />
        <path d="M12.7 9.7 14.3 11.3" />
      </g>
    </svg>
  );
}
