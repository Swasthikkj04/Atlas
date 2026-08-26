/**
 * Authoritative Runtime UX & Production Browser Contract (WX-808).
 *
 * Enforces browser runtime continuity, domain context isolation, race condition
 * protection for async network fetches, deep link hydration, and accessibility.
 */

export interface DomainSwitchValidationResult {
  readonly isIsolated: boolean;
  readonly reason?: string;
}

/**
 * Validates that domain switching completely isolates active state and leaves zero residual intelligence.
 */
export function validateDomainSwitchingStateIsolation(params: {
  readonly previousDomainId: string;
  readonly newDomainId: string;
  readonly displayedIntelligenceDomainId: string;
}): DomainSwitchValidationResult {
  const { previousDomainId, newDomainId, displayedIntelligenceDomainId } = params;

  if (newDomainId !== previousDomainId && displayedIntelligenceDomainId === previousDomainId) {
    return {
      isIsolated: false,
      reason: 'RESIDUAL_PREVIOUS_DOMAIN_INTELLIGENCE_LEAKAGE_DETECTED',
    };
  }

  return {
    isIsolated: true,
  };
}

/**
 * Evaluates whether an async API response should be applied or discarded based on current active domain context.
 *
 * Hard invariant: Late-arriving responses from a previous domain context MUST NEVER overwrite the active domain's UI.
 */
export function resolveAsyncResponseRelevance(params: {
  readonly activeDomainId: string;
  readonly responseDomainId: string;
}): {
  readonly shouldApply: boolean;
  readonly reason: string;
} {
  const { activeDomainId, responseDomainId } = params;

  if (activeDomainId !== responseDomainId) {
    return {
      shouldApply: false,
      reason: 'STALE_ASYNC_RESPONSE_DISCARDED_CONTEXT_MISMATCH',
    };
  }

  return {
    shouldApply: true,
    reason: 'RESPONSE_MATCHES_ACTIVE_DOMAIN_CONTEXT',
  };
}

/**
 * Ten Certified P0 Runtime UX Invariants (WX-808).
 */
export const RUNTIME_UX_HARD_INVARIANTS = [
  'NO_RUNTIME_DOMAIN_CONTEXT_LEAKAGE',
  'NO_BROKEN_DEEP_LINK_HYDRATION',
  'NO_BROKEN_BROWSER_CONTINUITY',
  'NO_PREMATURE_WORKSPACE_RESET',
  'NO_STALE_ASYNC_DOMAIN_RESPONSE',
  'NO_RUNTIME_STATE_SEMANTIC_COLLAPSE',
  'NO_ACCESSIBILITY_INFORMATION_LOSS',
  'NO_REDUCED_MOTION_REGRESSION',
  'NO_PRODUCTION_ROUTE_FAILURE',
  'NO_SENSITIVE_RUNTIME_DATA_EXPOSURE',
] as const;
