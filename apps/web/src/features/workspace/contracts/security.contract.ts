/**
 * Authoritative Security & Tenant Isolation Contract (WX-802).
 *
 * Enforces cross-tenant boundaries, IDOR prevention, search isolation,
 * and sanitized security auditing across all Workspace intelligence flows.
 */

export interface SecurityAuditResult {
  readonly isPermitted: boolean;
  readonly reason?: string;
  readonly sanitizedTarget?: string;
}

/**
 * Validates that an accessed domain belongs to the active authenticated tenant.
 *
 * Hard invariant: Requests for domains outside userOwnedDomainIds are strictly denied.
 */
export function validateTenantDomainAccess(params: {
  readonly requestedDomainId: string;
  readonly userOwnedDomainIds: readonly string[];
}): SecurityAuditResult {
  const { requestedDomainId, userOwnedDomainIds } = params;

  if (!requestedDomainId || typeof requestedDomainId !== 'string') {
    return {
      isPermitted: false,
      reason: 'INVALID_DOMAIN_ID',
      sanitizedTarget: '/workspace',
    };
  }

  const isOwned = userOwnedDomainIds.includes(requestedDomainId);

  if (!isOwned) {
    return {
      isPermitted: false,
      reason: 'UNAUTHORIZED_CROSS_TENANT_DOMAIN',
      sanitizedTarget: '/workspace',
    };
  }

  return {
    isPermitted: true,
  };
}

/**
 * Enforces that historical snapshot lineage cannot cross domain or tenant boundaries.
 */
export function validateSnapshotLineageIsolation(params: {
  readonly parentDomainId: string;
  readonly childDomainId: string;
}): boolean {
  if (!params.parentDomainId || !params.childDomainId) {
    return false;
  }
  return params.parentDomainId === params.childDomainId;
}

/**
 * Validates search execution isolation.
 *
 * Global search MUST enforce tenant-scoped filtering and reject cross-tenant inference.
 */
export function validateSearchIsolation(params: {
  readonly searchTenantId: string;
  readonly authenticatedTenantId: string;
}): boolean {
  if (!params.searchTenantId || !params.authenticatedTenantId) {
    return false;
  }
  return params.searchTenantId === params.authenticatedTenantId;
}

/**
 * Sanitizes security and operational log entries to prevent secret or stack trace leakage.
 */
export function formatSanitizedSecurityLog(params: {
  readonly operation: string;
  readonly correlationId: string;
  readonly tenantId?: string;
  readonly rawError?: unknown;
}): {
  readonly logMessage: string;
  readonly correlationId: string;
  readonly timestamp: string;
} {
  const timestamp = new Date().toISOString();
  // Never leak raw customer payload, passwords, API keys, or database connection strings
  const logMessage = `[SECURITY_AUDIT] Operation=${params.operation} CorrelationId=${params.correlationId} Status=PROCESSED`;

  return {
    logMessage,
    correlationId: params.correlationId,
    timestamp,
  };
}

/**
 * Hard Invariants list for WX-802 Security Hardening.
 */
export const SECURITY_HARD_INVARIANTS = [
  'NO_CROSS_TENANT_DATA_ACCESS',
  'NO_IDOR_VULNERABILITY',
  'NO_CROSS_DOMAIN_LINEAGE',
  'NO_CROSS_TENANT_SEARCH_LEAKAGE',
  'NO_EVIDENCE_ACCESS_BYPASS',
  'NO_AUTHENTICATION_BYPASS',
  'NO_AUTHORIZATION_BYPASS',
  'NO_OPEN_REDIRECT',
  'NO_SECRET_EXPOSURE_IN_BROWSER',
  'NO_SENSITIVE_STACK_TRACES_IN_PUBLIC_ERRORS',
] as const;
