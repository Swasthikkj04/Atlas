/**
 * Authoritative User Preferences & Appearance Contract (AX-107).
 *
 * Enforces canonical theme (system/light/dark) and motion (system/standard/reduced)
 * representations, resolution helpers, and cross-device sync boundaries.
 */

export type ThemePreference = 'system' | 'light' | 'dark';
export type MotionPreference = 'system' | 'standard' | 'reduced';

export interface UserPreferences {
  readonly theme: ThemePreference;
  readonly motion: MotionPreference;
  readonly updatedAt?: string | Date;
}

export interface UpdatePreferencesPayload {
  readonly theme?: ThemePreference;
  readonly motion?: MotionPreference;
}

/**
 * Resolves effective color scheme given user preference and operating system signal.
 */
export function resolveEffectiveTheme(
  mode: ThemePreference,
  isSystemDark: boolean,
): 'light' | 'dark' {
  if (mode === 'system') {
    return isSystemDark ? 'dark' : 'light';
  }
  return mode;
}

/**
 * Resolves effective reduced motion boolean given user preference and operating system signal.
 */
export function resolveEffectiveMotion(
  motion: MotionPreference,
  isSystemReduced: boolean,
): boolean {
  if (motion === 'system') {
    return isSystemReduced;
  }
  return motion === 'reduced';
}

/**
 * Formats canonical theme label.
 */
export function formatThemeLabel(theme: ThemePreference): string {
  switch (theme) {
    case 'system':
      return 'System (Auto)';
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    default:
      return theme;
  }
}

/**
 * Formats canonical motion label.
 */
export function formatMotionLabel(motion: MotionPreference): string {
  switch (motion) {
    case 'system':
      return 'System (Auto)';
    case 'standard':
      return 'Standard Motion';
    case 'reduced':
      return 'Reduced Motion';
    default:
      return motion;
  }
}

/**
 * Twelve Certified P0 User Preferences Hard Invariants (AX-107).
 */
export const PREFERENCES_HARD_INVARIANTS = [
  'NO_UNAUTHORIZED_PREFERENCE_ACCESS',
  'NO_CROSS_USER_PREFERENCE_LEAKAGE',
  'NO_ARBITRARY_PREFERENCE_MUTATION',
  'BACKEND_AUTHORITATIVE_PERSISTENCE',
  'NO_LOCALSTORAGE_ONLY_PERSISTENCE',
  'CANONICAL_THEME_ENUM_ONLY',
  'SYSTEM_THEME_REMAINS_SYSTEM',
  'NO_MOCKED_PREFERENCE_STATE',
  'UI_CONVERGES_TO_SERVER_TRUTH',
  'FAILED_PERSISTENCE_CANNOT_SILENTLY_LIE',
  'MOTION_PREFERENCE_RESPECTS_ACCESSIBILITY',
  'NO_PREMATURE_NOTIFICATION_OR_WORKSPACE_PREFERENCES',
] as const;

/**
 * Twelve Certified P0 Settings Interaction & Runtime Behavior Invariants (AX-110).
 */
export const SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS = [
  'NO_PRESENTATION_ONLY_SETTINGS',
  'THEME_SELECTION_CHANGES_REAL_UI',
  'THEME_PERSISTENCE_IS_AUTHORITATIVE',
  'SYSTEM_THEME_REMAINS_SYSTEM',
  'MOTION_SELECTION_CHANGES_REAL_BEHAVIOR',
  'PREFERENCES_SURVIVE_RELOAD',
  'PREFERENCES_SURVIVE_NAVIGATION',
  'PREFERENCES_APPLY_TO_WORKSPACE',
  'FAILED_PERSISTENCE_CANNOT_LIE',
  'NO_PAGE_LOCAL_THEME_AUTHORITY',
  'NO_CROSS_USER_PREFERENCE_CONTAMINATION',
  'ACCESSIBILITY_PREFERENCE_IS_BEHAVIORAL',
] as const;
