import type { GuestClaimContext } from './entry-state.contract';
import type { ClaimGuestSessionResponse } from '../../../services/api/guest';

export const GUEST_CLAIM_STORAGE_KEY = 'nebula_guest_claim';

/**
 * Raw structure stored in sessionStorage during Guest exploration.
 */
export interface StoredGuestClaimRecord {
  readonly sessionToken?: string;
  readonly domain?: string;
  readonly jobId?: string;
  readonly snapshotId?: string;
  readonly briefId?: string;
  readonly timestamp?: number;
}

/**
 * Extracts and normalizes the Guest claim context from browser session storage.
 * Returns null if no valid claim record is present.
 */
export function getStoredGuestClaimContext(): GuestClaimContext | null {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(GUEST_CLAIM_STORAGE_KEY);
    if (!raw) return null;

    const parsed: StoredGuestClaimRecord = JSON.parse(raw);
    if (!parsed || !parsed.domain) {
      return null;
    }

    return {
      domain: parsed.domain.trim(),
      jobId: parsed.jobId,
      snapshotId: parsed.snapshotId,
      briefId: parsed.briefId,
      claimedAt: parsed.timestamp ? new Date(parsed.timestamp).toISOString() : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Clears the temporary guest claim record from session storage.
 */
export function clearStoredGuestClaimContext(): void {
  if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
    try {
      window.sessionStorage.removeItem(GUEST_CLAIM_STORAGE_KEY);
    } catch {
      // Ignore storage clearance failures
    }
  }
}

/**
 * Maps a successful backend ClaimGuestSessionResponse into a normalized GuestClaimContext.
 */
export function mapClaimResponseToContext(
  response: ClaimGuestSessionResponse
): GuestClaimContext {
  return {
    domain: response.domainName,
    jobId: response.jobId,
    claimedAt: new Date().toISOString(),
  };
}
