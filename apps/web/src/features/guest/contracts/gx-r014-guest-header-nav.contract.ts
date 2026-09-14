/**
 * GX-R014 — Guest Workspace Header & Active Navigation Contract
 *
 * Phase: Guest Experience Architecture (GX-R)
 * Ticket: GX-R014
 * Type: GX / Workspace Shell / Header & Navigation / Visual Authority
 * Priority: P0 — Blocking
 * Depends on: GX-R013 🔒, SEC-GXWX-001 🔒
 * Status: FROZEN_HEADER_NAV_CONTRACT
 */

export const GX_R014_TICKET_ID = 'GX-R014' as const;
export const GX_R014_PHASE = 'Guest Experience Architecture' as const;
export const GX_R014_STATUS = 'FROZEN_HEADER_NAV_CONTRACT' as const;

export const GX_R014_PRIMARY_PRINCIPLE =
  'Calm, persistent spatial orientation. Clear ownership pathway. Zero layout shift across views.' as const;

export interface GuestHeaderNavConfig {
  readonly domain: string;
  readonly activeTab: string;
  readonly isEphemeral: boolean;
  readonly isVerified: boolean;
  readonly findingsCount: number;
  readonly evidenceCount: number;
}

export function validateGuestHeaderNavConfig(config: GuestHeaderNavConfig): {
  readonly valid: boolean;
  readonly errors: readonly string[];
} {
  const errors: string[] = [];

  if (!config.domain || config.domain.trim().length === 0) {
    errors.push('Domain cannot be empty in Guest Header');
  }

  const validTabs = [
    'overview',
    'architecture',
    'infrastructure',
    'findings',
    'evidence',
    'history',
  ];
  if (!validTabs.includes(config.activeTab)) {
    errors.push(`Active tab '${config.activeTab}' is not one of: ${validTabs.join(', ')}`);
  }

  if (config.findingsCount < 0) {
    errors.push('Findings count cannot be negative');
  }

  if (config.evidenceCount < 0) {
    errors.push('Evidence count cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const GX_R014_INVARIANTS = [
  'GX-R014-I01 — Persistent Orientation: Header anchors domain and ephemeral status at all times.',
  'GX-R014-I02 — Frictionless Reset: New Domain action allows instant return to domain input stage.',
  'GX-R014-I03 — Prominent Claim: Claim Infrastructure CTA is always visible and actionable.',
  'GX-R014-I04 — Animated Tab Indicator: Spring physics indicator highlights active tab without layout jump.',
  'GX-R014-I05 — Keyboard Parity: Tab bar supports ArrowLeft, ArrowRight, Home, and End keys.',
] as const;
