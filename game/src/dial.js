export const DIALS = {
  fastball: { start: 0.64, end: 0.8, ms: 920 },
  sinker: { start: 0.5, end: 0.68, ms: 1080 },
  slider: { start: 0.4, end: 0.58, ms: 1220 },
  curve: { start: 0.28, end: 0.48, ms: 1420 },
  changeup: { start: 0.16, end: 0.36, ms: 1560 },
};

export function gradeDial(type, position) {
  const dial = DIALS[type];
  if (position == null || !dial) return { error: 1, late: true };
  const { start, end } = dial;
  if (position >= start && position <= end) {
    const mid = (start + end) / 2;
    const half = (end - start) / 2 || 1;
    return { error: (Math.abs(position - mid) / half) * 0.2, late: false };
  }
  if (position < start) {
    return { error: Math.min(1, 0.45 + ((start - position) / 0.45) * 0.55), late: false };
  }
  return { error: Math.min(1, 0.45 + ((position - end) / 0.45) * 0.55), late: true };
}

export function dialPoint(position, radius = 78) {
  const angle = Math.PI * (1 - position);
  return {
    x: 100 + radius * Math.cos(angle),
    y: 108 - radius * Math.sin(angle),
  };
}
