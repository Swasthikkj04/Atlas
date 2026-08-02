// ─── Platform Easing & Motion Constants ─────────────────────────────────────
export const EASE_BEZIER: readonly [number, number, number, number] = [0.4, 0, 0.2, 1];
export const EASE_CSS = 'cubic-bezier(0.4, 0, 0.2, 1)';

// ─── Animation Durations (in ms) ───────────────────────────────────────────
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  fadeUp: 580,
  pause: 520,
} as const;

// ─── Layout Constants ──────────────────────────────────────────────────────
export const LAYOUT_CONSTANTS = {
  maxContentWidth: 720,
} as const;
