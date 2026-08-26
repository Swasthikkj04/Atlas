/**
 * Authoritative Active Sessions & Device Management Contract (AX-105).
 *
 * Enforces session representation, formatting helpers, and security boundaries
 * for active device sessions and remote session revocation.
 */

export interface UserSession {
  readonly id: string;
  readonly deviceName: string;
  readonly deviceType: string;
  readonly browser: string;
  readonly operatingSystem: string;
  readonly ipAddress: string;
  readonly lastActivityAt: string | Date;
  readonly expiresAt: string | Date;
  readonly createdAt: string | Date;
  readonly isCurrent?: boolean;
}

/**
 * Formats session device & browser summary.
 * E.g., "Chrome · Linux" or "Safari · macOS"
 */
export function formatDeviceSummary(session: Partial<UserSession>): string {
  const browser = session.browser && session.browser !== 'Unknown' ? session.browser : 'Browser';
  const os =
    session.operatingSystem && session.operatingSystem !== 'Unknown'
      ? session.operatingSystem
      : 'Device';

  return `${browser} · ${os}`;
}

/**
 * Formats relative activity time from backend timestamp.
 * Returns calm, human-readable strings like "Active now", "Active 5m ago", "Active 2h ago", "Active yesterday".
 */
export function formatSessionActivityTime(
  rawTimestamp?: string | Date,
  referenceNow: number = Date.now(),
): string {
  if (!rawTimestamp) return 'Active recently';

  const date = typeof rawTimestamp === 'string' ? new Date(rawTimestamp) : rawTimestamp;
  const timeMs = date.getTime();
  if (isNaN(timeMs)) return 'Active recently';

  const diffSeconds = Math.max(0, Math.floor((referenceNow - timeMs) / 1000));

  if (diffSeconds < 60) {
    return 'Active now';
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `Active ${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Active ${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'Active yesterday';
  }

  return `Active ${diffDays}d ago`;
}

/**
 * Twelve Certified P0 Session Management Hard Invariants (AX-105).
 */
export const SESSION_MANAGEMENT_HARD_INVARIANTS = [
  'NO_UNAUTHORIZED_SESSION_ACCESS',
  'NO_CROSS_USER_SESSION_REVOCATION',
  'NO_SESSION_SECRET_EXPOSURE',
  'NO_TOKEN_EXPOSURE',
  'NO_MOCKED_SESSION_DATA',
  'CURRENT_SESSION_IS_AUTHORITATIVE',
  'NO_LOCAL_SESSION_REGISTRY',
  'REVOCATION_REQUIRES_SERVER_CONFIRMATION',
  'LOGOUT_ALL_PRESERVES_CURRENT_SESSION',
  'SESSION_LIST_CONVERGES_TO_SERVER_TRUTH',
  'NO_UNAUTHENTICATED_SESSION_MANAGEMENT',
  'NO_SECURITY_ACTIVITY_UI_FABRICATION',
] as const;
