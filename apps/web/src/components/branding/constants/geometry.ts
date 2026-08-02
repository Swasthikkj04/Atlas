// Brand Geometry Constants for Nebula Branding Platform

export interface LivingLogoNode {
  readonly cx: number;
  readonly cy: number;
}

export interface ConstellationNode {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly dx: number;
  readonly dy: number;
  readonly dur: number;
}

/**
 * Living Logo SVG geometry (Nodes within 96x46 coordinate space)
 * Wordmark occupies approximately x: 10–86, y: 14–32
 */
export const LIVING_LOGO_NODES: readonly LivingLogoNode[] = [
  { cx: 3, cy: 5 },   // 0 — top-left
  { cx: 48, cy: 1 },  // 1 — above center
  { cx: 88, cy: 7 },  // 2 — top-right
  { cx: 14, cy: 40 }, // 3 — below-left
] as const;

/**
 * Living Logo connection edge pairs referencing node indices
 */
export const LIVING_LOGO_EDGES: readonly (readonly [number, number])[] = [
  [0, 1], // top-left  → above-center
  [1, 2], // above-center → top-right
  [0, 3], // top-left  → below-left
] as const;

export const LIVING_LOGO_VIEWBOX = '0 0 96 46' as const;

export const LIVING_LOGO_WORDMARK_BOUNDS = {
  xMin: 10,
  xMax: 86,
  yMin: 14,
  yMax: 32,
} as const;

/**
 * Background Constellation SVG geometry (Nodes within 800x500 coordinate space)
 * Each node drifts by (dx, dy) pixels over (dur) seconds.
 */
export const CONSTELLATION_NODES: readonly ConstellationNode[] = [
  { id: 0, x: 95, y: 48, r: 2.2, dx: 5, dy: -4, dur: 20 },
  { id: 1, x: 258, y: 82, r: 2.8, dx: -4, dy: 5, dur: 24 },
  { id: 2, x: 428, y: 36, r: 1.8, dx: 6, dy: 3, dur: 18 },
  { id: 3, x: 585, y: 68, r: 1.8, dx: -5, dy: -3, dur: 26 },
  { id: 4, x: 720, y: 52, r: 2.0, dx: 4, dy: 4, dur: 22 },
  { id: 5, x: 138, y: 205, r: 1.8, dx: 3, dy: 6, dur: 22 },
  { id: 6, x: 362, y: 224, r: 2.8, dx: -6, dy: -4, dur: 21 },
  { id: 7, x: 508, y: 180, r: 1.8, dx: 4, dy: -5, dur: 25 },
  { id: 8, x: 680, y: 210, r: 2.2, dx: -5, dy: 3, dur: 23 },
  { id: 9, x: 72, y: 338, r: 1.5, dx: -3, dy: 4, dur: 19 },
  { id: 10, x: 298, y: 315, r: 1.8, dx: 5, dy: -6, dur: 23 },
  { id: 11, x: 574, y: 292, r: 1.5, dx: -3, dy: 5, dur: 27 },
  { id: 12, x: 740, y: 350, r: 2.0, dx: 4, dy: -4, dur: 24 },
  { id: 13, x: 180, y: 440, r: 1.5, dx: 3, dy: -3, dur: 25 },
  { id: 14, x: 440, y: 420, r: 2.0, dx: -4, dy: 4, dur: 22 },
  { id: 15, x: 640, y: 450, r: 1.8, dx: 5, dy: -5, dur: 26 },
] as const;

/**
 * Connecting line pairs between node indices in Background Constellation
 */
export const CONSTELLATION_EDGES: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [5, 6],
  [6, 7],
  [7, 8],
  [9, 10],
  [10, 6],
  [11, 7],
  [11, 12],
  [13, 10],
  [14, 11],
  [15, 12],
] as const;

export const CONSTELLATION_VIEWBOX = '0 0 800 500' as const;
