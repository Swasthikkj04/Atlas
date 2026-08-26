/**
 * Authoritative TypeScript Design Token Registry for Nebula Workspace.
 *
 * Implements the frozen visual language specified in WX-000.
 * Every visual value used across the Workspace MUST originate from these tokens.
 */

export const DESIGN_TOKENS = {
  /**
   * Typography System (Frozen)
   */
  typography: {
    fonts: {
      sans: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: "'Newsreader', 'Lora', Georgia, serif",
      serif: "'Lora', 'Newsreader', Georgia, serif",
      mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    scale: {
      display2xl: {
        size: 'clamp(2.75rem, 2rem + 3vw, 4.25rem)',
        lh: 1.05,
        tracking: '-0.035em',
        var: 'var(--fs-display-2xl)',
      },
      displayXl: {
        size: 'clamp(2.25rem, 1.75rem + 2.2vw, 3.5rem)',
        lh: 1.10,
        tracking: '-0.030em',
        var: 'var(--fs-display-xl)',
      },
      heading1: {
        size: '2.25rem',
        px: 36,
        lh: 1.15,
        tracking: '-0.025em',
        var: 'var(--fs-heading-1)',
      },
      heading2: {
        size: '1.5rem',
        px: 24,
        lh: 1.25,
        tracking: '-0.020em',
        var: 'var(--fs-heading-2)',
      },
      heading3: {
        size: '1.25rem',
        px: 20,
        lh: 1.35,
        tracking: '-0.015em',
        var: 'var(--fs-heading-3)',
      },
      heading4: {
        size: '1.0rem',
        px: 16,
        lh: 1.40,
        tracking: '-0.010em',
        var: 'var(--fs-heading-4)',
      },
      bodyLg: {
        size: '1.0625rem',
        px: 17,
        lh: 1.60,
        tracking: '-0.005em',
        var: 'var(--fs-body-lg)',
      },
      body: {
        size: '0.9375rem',
        px: 15,
        lh: 1.60,
        tracking: '0em',
        var: 'var(--fs-body)',
      },
      bodySm: {
        size: '0.875rem',
        px: 14,
        lh: 1.50,
        tracking: '0em',
        var: 'var(--fs-body-sm)',
      },
      caption: {
        size: '0.75rem',
        px: 12,
        lh: 1.40,
        tracking: '0.010em',
        var: 'var(--fs-caption)',
      },
      eyebrow: {
        size: '0.6875rem',
        px: 11,
        lh: 1.40,
        tracking: '0.280em',
        var: 'var(--fs-eyebrow)',
      },
      monoCode: {
        size: '0.8125rem',
        px: 13,
        lh: 1.50,
        tracking: '0em',
        var: 'var(--fs-mono-code)',
      },
      monoSm: {
        size: '0.75rem',
        px: 12,
        lh: 1.40,
        tracking: '0.025em',
        var: 'var(--fs-mono-sm)',
      },
    },
  },

  /**
   * Iconography System (Frozen Lucide-React Foundation)
   */
  icons: {
    sizes: {
      micro: { px: 12, className: 'w-3 h-3' },
      small: { px: 14, className: 'w-3.5 h-3.5' },
      default: { px: 16, className: 'w-4 h-4' },
      medium: { px: 20, className: 'w-5 h-5' },
      large: { px: 24, className: 'w-6 h-6' },
    },
    strokes: {
      display: 1.5, // 24px+
      ui: 1.75, // 16-20px (Default)
      micro: 2.0, // 12-14px
    },
  },

  /**
   * Application Surface Hierarchy (Light & Dark)
   */
  surfaces: {
    app: {
      light: '#FAFAFA',
      dark: '#0F1115',
      var: 'var(--surface-app)',
    },
    understanding: {
      light: '#FFFFFF',
      dark: '#14171C',
      var: 'var(--surface-understanding)',
    },
    matters: {
      light: '#F7F8FA',
      dark: '#181C22',
      var: 'var(--surface-matters)',
    },
    infrastructure: {
      light: '#F8F9FA',
      dark: '#15191F',
      var: 'var(--surface-infrastructure)',
    },
    evidence: {
      light: '#F3F5F7',
      dark: '#1C2128',
      var: 'var(--surface-evidence)',
    },
    preserve: {
      light: '#EEF2F5',
      dark: '#20262E',
      var: 'var(--surface-preserve)',
    },
    muted: {
      light: '#F2F2F0',
      dark: '#1E1E1C',
      var: 'var(--muted)',
    },
  },

  /**
   * Text & Foreground Hierarchy
   */
  text: {
    foreground: {
      light: '#111110',
      dark: '#F0F0EE',
      var: 'var(--foreground)',
    },
    mutedForeground: {
      light: '#6C6C72',
      dark: '#88887E',
      var: 'var(--muted-foreground)',
    },
    disabled: {
      light: '#9CA3AF',
      dark: '#4B5563',
      var: 'var(--color-neutral-400)',
    },
  },

  /**
   * Borders & Focus Tokens
   */
  borders: {
    hairline: {
      light: 'rgba(0, 0, 0, 0.07)',
      dark: 'rgba(255, 255, 255, 0.09)',
      var: 'var(--border)',
    },
    strong: {
      light: 'rgba(0, 0, 0, 0.12)',
      dark: 'rgba(255, 255, 255, 0.15)',
      var: 'var(--border-strong)',
    },
    ring: {
      light: 'rgba(26, 86, 219, 0.45)',
      dark: 'rgba(96, 165, 250, 0.55)',
      var: 'var(--ring)',
    },
  },

  /**
   * 6-Tier Semantic Severity Scale (Restrained)
   */
  severity: {
    critical: {
      text: { light: '#d4183d', dark: '#ef4444', var: 'var(--severity-critical)' },
      bg: { light: 'rgba(212, 24, 61, 0.08)', dark: 'rgba(239, 68, 68, 0.12)', var: 'var(--severity-critical-bg)' },
      border: { light: 'rgba(212, 24, 61, 0.20)', dark: 'rgba(239, 68, 68, 0.25)', var: 'var(--severity-critical-border)' },
    },
    high: {
      text: { light: '#d97706', dark: '#f59e0b', var: 'var(--severity-high)' },
      bg: { light: 'rgba(217, 119, 6, 0.08)', dark: 'rgba(245, 158, 11, 0.12)', var: 'var(--severity-high-bg)' },
      border: { light: 'rgba(217, 119, 6, 0.20)', dark: 'rgba(245, 158, 11, 0.25)', var: 'var(--severity-high-border)' },
    },
    medium: {
      text: { light: '#b45309', dark: '#fbbf24', var: 'var(--severity-medium)' },
      bg: { light: 'rgba(180, 83, 9, 0.08)', dark: 'rgba(251, 191, 36, 0.12)', var: 'var(--severity-medium-bg)' },
      border: { light: 'rgba(180, 83, 9, 0.20)', dark: 'rgba(251, 191, 36, 0.25)', var: 'var(--severity-medium-border)' },
    },
    low: {
      text: { light: '#2563eb', dark: '#60a5fa', var: 'var(--severity-low)' },
      bg: { light: 'rgba(37, 99, 235, 0.08)', dark: 'rgba(96, 165, 250, 0.12)', var: 'var(--severity-low-bg)' },
      border: { light: 'rgba(37, 99, 235, 0.20)', dark: 'rgba(96, 165, 250, 0.25)', var: 'var(--severity-low-border)' },
    },
    informational: {
      text: { light: '#64748b', dark: '#94a3b8', var: 'var(--severity-info)' },
      bg: { light: 'rgba(100, 116, 139, 0.08)', dark: 'rgba(148, 163, 184, 0.12)', var: 'var(--severity-info-bg)' },
      border: { light: 'rgba(100, 116, 139, 0.20)', dark: 'rgba(148, 163, 184, 0.25)', var: 'var(--severity-info-border)' },
    },
    success: {
      text: { light: '#059669', dark: '#10b981', var: 'var(--severity-success)' },
      bg: { light: 'rgba(5, 150, 105, 0.08)', dark: 'rgba(16, 185, 129, 0.12)', var: 'var(--severity-success-bg)' },
      border: { light: 'rgba(5, 150, 105, 0.20)', dark: 'rgba(16, 185, 129, 0.25)', var: 'var(--severity-success-border)' },
    },
  },

  /**
   * Spatial Scale (Base-8 / Base-4 Rhythm)
   */
  spacing: {
    '3xs': { px: 2, rem: '0.125rem', var: 'var(--space-3xs)' },
    '2xs': { px: 4, rem: '0.25rem', var: 'var(--space-2xs)' },
    xs: { px: 8, rem: '0.5rem', var: 'var(--space-xs)' },
    sm: { px: 12, rem: '0.75rem', var: 'var(--space-sm)' },
    md: { px: 16, rem: '1rem', var: 'var(--space-md)' },
    lg: { px: 24, rem: '1.5rem', var: 'var(--space-lg)' },
    xl: { px: 32, rem: '2rem', var: 'var(--space-xl)' },
    '2xl': { px: 48, rem: '3rem', var: 'var(--space-2xl)' },
    '3xl': { px: 72, rem: '4.5rem', var: 'var(--space-3xl)' },
    '4xl': { px: 96, rem: '6rem', var: 'var(--space-4xl)' },
  },

  /**
   * Border Radius Scale
   */
  radius: {
    xs: { px: 2, var: 'var(--radius-xs)' },
    sm: { px: 4, var: 'var(--radius-sm)' },
    md: { px: 8, var: 'var(--radius-md)' },
    lg: { px: 12, var: 'var(--radius-lg)' },
    xl: { px: 16, var: 'var(--radius-xl)' },
    '2xl': { px: 24, var: 'var(--radius-2xl)' },
    pill: { px: 9999, var: 'var(--radius-pill)' },
  },

  /**
   * Elevation & Shadows
   */
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.10), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
    glow: '0 0 32px -8px rgba(139, 92, 246, 0.20)',
    // WX-1017 Premium Shadows
    premiumXs: '0 1px 2px rgba(16, 24, 20, 0.035)',
    premiumSm: '0 2px 8px rgba(16, 24, 20, 0.045)',
    premiumMd: '0 4px 16px rgba(16, 24, 20, 0.055)',
    button: '0 2px 5px rgba(16, 24, 20, 0.10)',
  },

  /**
   * WX-1017 Premium Surface Shading, Border Hierarchy & Semantic Color System
   */
  premium: {
    surfaces: {
      canvas: '#F7F7F5',
      primary: '#FFFFFF',
      secondary: '#FAFAF8',
      elevated: '#FCFCFA',
      metadata: '#F4F4F1',
      rowHover: '#F7F8F6',
      rowActive: '#F1F6F3',
    },
    borders: {
      default: '#E7E7E3',
      strong: '#DCDCD7',
      divider: '#EEEEEB',
      card: '#E1E1DC',
      brief: '#E2E2DE',
      metadata: '#E2E2DD',
      cardHover: '#DADAD5',
    },
    shadows: {
      xs: '0 1px 2px rgba(16, 24, 20, 0.035)',
      sm: '0 2px 8px rgba(16, 24, 20, 0.045)',
      md: '0 4px 16px rgba(16, 24, 20, 0.055)',
      button: '0 2px 5px rgba(16, 24, 20, 0.10)',
    },
    semantic: {
      stable: {
        primary: '#178A68',
        bg: '#EAF7F2',
        border: '#B9E5D6',
        accent: '#1F9D73',
      },
      attention: {
        primary: '#B86F18',
        bg: '#FFF4E3',
        border: '#F0D3A5',
        accent: '#C98224',
      },
      high: {
        primary: '#C24D57',
        bg: '#FFF0F1',
        border: '#F0C3C7',
      },
      critical: {
        primary: '#A93442',
        bg: '#FDEBEC',
        border: '#E9B3B9',
        accent: '#C94B58',
      },
      informational: {
        primary: '#3568C8',
        bg: '#EEF4FF',
        border: '#C8D8F6',
      },
      neutralMetadata: {
        text: '#5F625F',
        bg: '#F4F4F1',
        border: '#E2E2DD',
      },
    },
    button: {
      bg: '#171816',
      text: '#FFFFFF',
      border: '#171816',
      shadow: '0 2px 5px rgba(16, 24, 20, 0.10)',
      hoverBg: '#252724',
      pressedBg: '#0F100F',
      transition: '150ms ease-out',
    },
    hover: {
      cardBg: '#FCFCFA',
      cardBorder: '#DADAD5',
      rowBg: '#F7F8F6',
      link: '#3568C8',
      transition: '150ms ease-out',
    },
  },

  /**
   * Layout Boundary Tokens
   */
  layoutBoundaries: {
    form: { px: 420, var: 'var(--max-w-form)' },
    dialog: { px: 640, var: 'var(--max-w-dialog)' },
    reading: { px: 760, var: 'var(--max-w-reading)' },
    workspace: { px: 1440, var: 'var(--max-w-workspace)' },
  },

  /**
   * Canonical Stacking Context / Z-Index Scale
   */
  zIndex: {
    base: 0,
    card: 1,
    sticky: 50,
    header: 100,
    dropdown: 200,
    backdrop: 900,
    modal: 1000,
    popover: 1050,
    tooltip: 1100,
    toast: 1200,
  },

  /**
   * Motion & Duration Tokens
   */
  motion: {
    durations: {
      instant: '100ms',
      fast: '180ms',
      normal: '250ms',
      slow: '380ms',
      deliberate: '580ms',
      pause: '520ms', // The Nebula Pause
    },
    easings: {
      default: 'cubic-bezier(0.16, 1, 0.3, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
} as const;

export const PREMIUM_SURFACE_PALETTE = DESIGN_TOKENS.premium.surfaces;
export const PREMIUM_BORDER_TOKENS = DESIGN_TOKENS.premium.borders;
export const PREMIUM_SHADOWS = DESIGN_TOKENS.premium.shadows;
export const PREMIUM_SEMANTIC_PALETTE = DESIGN_TOKENS.premium.semantic;
export const PREMIUM_BUTTON_TOKENS = DESIGN_TOKENS.premium.button;

export type DesignTokens = typeof DESIGN_TOKENS;
