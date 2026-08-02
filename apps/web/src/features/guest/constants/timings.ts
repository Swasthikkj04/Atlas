// Timing Constants for Guest Feature

// GX-006: Timing within the 1.2–1.5 s range per sentence.
export const SENTENCE_DURATIONS: readonly number[] = [1450, 1300, 1400, 1250, 1350];

// SX-002: Nebula Pause duration
export const PAUSE_DURATION = 520;

// SX-004: Progressive Understanding reveal timing
export const SECTION_REVEAL_INTERVAL = 530;
export const SECTION_REVEAL_INITIAL_DELAY = 260;
export const SECTION_REVEAL_DELAYS: readonly number[] = [1, 2, 3, 4, 5, 6].map(
  (_, i) => i * SECTION_REVEAL_INTERVAL + SECTION_REVEAL_INITIAL_DELAY
);
