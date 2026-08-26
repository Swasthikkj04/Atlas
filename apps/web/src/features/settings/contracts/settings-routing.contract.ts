/**
 * Authoritative Settings Routing & Information Architecture Contract (AX-102).
 *
 * Enforces the canonical 3-section settings hierarchy:
 * /settings            -> redirects/resolves to /settings/account
 * /settings/account    -> Account & Identity management
 * /settings/security   -> Authentication, sessions & credentials
 * /settings/appearance -> Theme & motion preferences
 */

export type SettingsSection = 'account' | 'security' | 'appearance';

export interface SettingsSectionDefinition {
  readonly id: SettingsSection;
  readonly title: string;
  readonly path: string;
  readonly description: string;
}

export const CANONICAL_SETTINGS_SECTIONS: readonly SettingsSectionDefinition[] = [
  {
    id: 'account',
    title: 'Account',
    path: '/settings/account',
    description: 'Manage your identity, profile, and email address.',
  },
  {
    id: 'security',
    title: 'Security',
    path: '/settings/security',
    description: 'Manage authentication, credentials, and active device sessions.',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    path: '/settings/appearance',
    description: 'Customize theme, visual density, and motion preferences.',
  },
] as const;

/**
 * Resolves a settings URL pathname into its authoritative section.
 *
 * /settings or /settings/ -> defaults to 'account'
 * /settings/account       -> 'account'
 * /settings/security      -> 'security'
 * /settings/appearance    -> 'appearance'
 */
export function resolveSettingsSection(rawPathname: string): SettingsSection {
  if (!rawPathname) return 'account';

  const pathname =
    rawPathname.length > 1 && rawPathname.endsWith('/')
      ? rawPathname.slice(0, -1)
      : rawPathname;

  if (pathname === '/settings/security' || pathname.startsWith('/settings/security/')) {
    return 'security';
  }

  if (pathname === '/settings/appearance' || pathname.startsWith('/settings/appearance/')) {
    return 'appearance';
  }

  // Default to 'account' for /settings, /settings/account, or unrecognized subroutes
  return 'account';
}

/**
 * Returns the canonical URL path for a given settings section.
 */
export function buildSettingsPath(section: SettingsSection): string {
  switch (section) {
    case 'security':
      return '/settings/security';
    case 'appearance':
      return '/settings/appearance';
    case 'account':
    default:
      return '/settings/account';
  }
}

/**
 * Ten Certified P0 Settings Foundation Invariants (AX-102).
 */
export const SETTINGS_HARD_INVARIANTS = [
  'NO_UNPROTECTED_SETTINGS_ROUTE',
  'NO_DEAD_SETTINGS_NAVIGATION_LINKS',
  'NO_UNAUTHENTICATED_SETTINGS_ACCESS',
  'NO_INVENTED_SETTINGS_DESIGN_TOKENS',
  'NO_MOCKED_CAPABILITY_DATA',
  'NO_DISCONNECTED_SETTINGS_SHELL',
  'NO_BROKEN_SETTINGS_DEEP_LINKS',
  'NO_ACCESSIBILITY_LANDMARK_LOSS',
  'NO_BROKEN_BROWSER_HISTORY_NAVIGATION',
  'NO_PREMATURE_CAPABILITY_EXPOSURE',
] as const;
