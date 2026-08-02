// Branding Tokens for Nebula Platform Visual Identity

export const BRANDING_TOKENS = {
  logo: {
    dimensions: {
      width: 76,
      height: 18,
      svgWidth: 96,
      svgHeight: 46,
      svgTopOffset: -14,
      svgLeftOffset: -10,
    },
    nodeRadius: 1.6,
    strokeWidth: 0.7,
    opacities: {
      activeNode: 0.55,
      pausingNode: 0.35,
      settledNode: 0.18,
      idleNode: 0.14,
      activeLine: 0.22,
      pausingLine: 0.14,
      idleLine: 0,
    },
    timing: {
      lineDurationBase: 1.0,
      lineDurationStagger: 0.28,
      lineResetDuration: 0.5,
      lineOpacityDuration: 0.45,
      nodeDuration: 0.55,
      nodeDelayStagger: 0.06,
    },
  },
  constellation: {
    viewBox: '0 0 800 500',
    strokeWidth: 0.8,
    opacities: {
      idle: 0.08,
      active: 0.04,
      error: 0.08,
      hidden: 0,
      maxOpacity: 0.05,
    },
    timing: {
      fadeDuration: 1.6, // seconds for opacity transition
    },
    density: {
      low: 0.4,    // 40% of nodes
      medium: 0.7, // 70% of nodes
      high: 1.0,   // 100% of nodes
    },
  },
} as const;

export type ConstellationDensity = keyof typeof BRANDING_TOKENS.constellation.density;
