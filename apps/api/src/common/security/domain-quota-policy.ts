/**
 * SEC-GXWX-003 — Domain Quota & Ownership Boundary Policy
 *
 * Enforces authoritative account-level domain quota across all ingress vectors:
 * - Direct Workspace Domain Addition (DomainsService.create)
 * - Ephemeral Guest Experience (GX) Claim (GuestUnderstandingService.claimGuestSession)
 * - OAuth / SSO Account Conversion & Claiming
 * - Direct API Invocation
 *
 * Frozen Security Invariant:
 * "A user may never own more domains than the active account policy permits,
 * regardless of how the domain enters the account. Quota must be enforced
 * server-side against authenticated persisted ownership."
 */

import { BadRequestException } from '@nestjs/common';

export const MAX_WORKSPACE_DOMAINS = 4;
export const WORKSPACE_DOMAIN_LIMIT_ERROR_MESSAGE =
  'Sorry, your domain limit has been reached.';

export interface DomainQuotaEvaluation {
  readonly allowed: boolean;
  readonly currentCount: number;
  readonly requestedAdditionCount: number;
  readonly maxAllowed: number;
  readonly remainingQuota: number;
  readonly reason: 'ADMITTED' | 'QUOTA_EXCEEDED';
}

export class DomainQuotaPolicy {
  public static readonly MAX_DOMAINS = MAX_WORKSPACE_DOMAINS;
  public static readonly ERROR_MESSAGE = WORKSPACE_DOMAIN_LIMIT_ERROR_MESSAGE;

  /**
   * Pure evaluation of domain quota admissibility.
   *
   * @param currentCount Persisted domain count currently owned by user
   * @param requestedAdditionCount Number of new domains being requested (typically 1)
   * @param maxAllowed Maximum allowed domains per account (default: 4)
   */
  public static evaluateQuota(
    currentCount: number,
    requestedAdditionCount = 1,
    maxAllowed = MAX_WORKSPACE_DOMAINS,
  ): DomainQuotaEvaluation {
    const safeCurrent = Math.max(0, currentCount || 0);
    const safeAddition = Math.max(0, requestedAdditionCount || 0);
    const projectedTotal = safeCurrent + safeAddition;
    const allowed = projectedTotal <= maxAllowed;
    const remainingQuota = Math.max(0, maxAllowed - safeCurrent);

    return {
      allowed,
      currentCount: safeCurrent,
      requestedAdditionCount: safeAddition,
      maxAllowed,
      remainingQuota,
      reason: allowed ? 'ADMITTED' : 'QUOTA_EXCEEDED',
    };
  }

  /**
   * Authoritative guard: throws BadRequestException if adding requested domains exceeds quota.
   *
   * @param currentCount Persisted domain count currently owned by user
   * @param requestedAdditionCount Number of new domains being requested (default: 1)
   * @param maxAllowed Maximum allowed domains per account (default: 4)
   */
  public static assertAdmissible(
    currentCount: number,
    requestedAdditionCount = 1,
    maxAllowed = MAX_WORKSPACE_DOMAINS,
  ): void {
    const evaluation = this.evaluateQuota(
      currentCount,
      requestedAdditionCount,
      maxAllowed,
    );

    if (!evaluation.allowed) {
      throw new BadRequestException(this.ERROR_MESSAGE);
    }
  }
}
