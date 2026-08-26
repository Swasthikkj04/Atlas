/**
 * Authoritative Settings Section Iconography & Visual Completion Contract (WX-810).
 *
 * Enforces canonical iconography mappings, icon container tokens, and semantic
 * visual completion across all Settings surfaces (Account, Security, Appearance).
 *
 * Characteristics:
 * - 32px x 32px container (w-8 h-8)
 * - 16px glyph (size="default")
 * - Subtle neutral surface (bg-muted/60)
 * - Subtle border (border border-border-hairline)
 * - Existing radius token (rounded-lg)
 * - Centered icon (flex items-center justify-center)
 * - Muted foreground token (text-muted-foreground)
 */

export interface SettingsSectionIconContract {
  readonly id: string;
  readonly section: string;
  readonly iconName: string;
  readonly containerSizePx: 32;
  readonly glyphSizePx: 16;
  readonly visualRole: 'identity' | 'action' | 'status';
}

export const SETTINGS_SECTION_ICONOGRAPHY_MAPPING: Record<string, SettingsSectionIconContract> = {
  // Security Surface
  passwordAndCredentials: {
    id: 'password-credentials',
    section: 'security',
    iconName: 'KeyRound',
    containerSizePx: 32,
    glyphSizePx: 16,
    visualRole: 'identity',
  },
  activeSessions: {
    id: 'active-sessions',
    section: 'security',
    iconName: 'MonitorSmartphone',
    containerSizePx: 32,
    glyphSizePx: 16,
    visualRole: 'identity',
  },
  // Account Surface
  accountProfile: {
    id: 'account-profile',
    section: 'account',
    iconName: 'UserRound',
    containerSizePx: 32,
    glyphSizePx: 16,
    visualRole: 'identity',
  },
  accountLifecycle: {
    id: 'account-lifecycle',
    section: 'account',
    iconName: 'UserRoundCog',
    containerSizePx: 32,
    glyphSizePx: 16,
    visualRole: 'identity',
  },
  // Appearance Surface
  interfaceTheme: {
    id: 'interface-theme',
    section: 'appearance',
    iconName: 'Palette',
    containerSizePx: 32,
    glyphSizePx: 16,
    visualRole: 'identity',
  },
  motionAccessibility: {
    id: 'motion-accessibility',
    section: 'appearance',
    iconName: 'Sparkles',
    containerSizePx: 32,
    glyphSizePx: 16,
    visualRole: 'identity',
  },
} as const;

/**
 * Certified P0/P1 Invariants for WX-810 Settings Section Iconography.
 */
export const SETTINGS_ICONOGRAPHY_HARD_INVARIANTS = [
  'NO_BEHAVIORAL_REGRESSION',
  'NO_NEW_DESIGN_TOKEN_SYSTEM',
  'NO_NEW_ICON_DEPENDENCY_WITHOUT_JUSTIFICATION',
  'NO_COLORFUL_DASHBOARD_TREATMENT',
  'NO_ACCESSIBILITY_REGRESSION',
  'NO_INFORMATION_ARCHITECTURE_CHANGE',
  'NO_SETTINGS_CONTRACT_CHANGE',
  'NO_MOCKED_OR_FAKE_UI_STATE',
  'ICONOGRAPHY_REMAINS_CONSISTENT',
  'RESPONSIVE_LAYOUT_REMAINS_INTACT',
] as const;
