/**
 * S-07 — API Abuse, Rate Limiting & DoS Resistance Web Contract
 *
 * Phase: Production Security Hardening
 * Priority: P0 — BLOCKING
 * Type: Security / API / Abuse Prevention / Rate Limiting / DoS / Web / Contract
 * Depends on: S-01 🔒, S-02 🔒, S-03 🔒, S-04 🔒, S-05 🔒, S-06 🔒
 * Blocks: S-08 → S-12 and Production Release
 * Status: CERTIFIED_API_ABUSE_RATE_LIMIT_DOS_SECURITY
 */

export const S07_TICKET_ID = 'S-07' as const;
export const S07_PHASE = 'Production Security Hardening' as const;
export const S07_PRIORITY = 'P0 — BLOCKING' as const;
export const S07_TYPE = 'Security / API / Abuse Prevention / Rate Limiting / DoS / Web / Contract' as const;
export const S07_STATUS = 'CERTIFIED_API_ABUSE_RATE_LIMIT_DOS_SECURITY' as const;
export const S07_DEPENDS_ON = ['S-01', 'S-02', 'S-03', 'S-04', 'S-05', 'S-06'] as const;
export const S07_BLOCKS = ['S-08', 'S-09', 'S-10', 'S-11', 'S-12', 'Production Release'] as const;

export const S07_CERTIFICATION_STATEMENT =
  'Every externally reachable Nebula operation is protected against uncontrolled request volume, resource exhaustion, credential abuse, enumeration, replay, and application-layer denial of service through server-enforced, identity-aware, endpoint-aware, and fail-closed abuse controls.';

export const S07_SECONDARY_GATE =
  "Nebula remains available under hostile request conditions because every externally reachable operation has bounded resource consumption, identity-aware admission control, endpoint-specific rate policies, concurrency limits, timeout enforcement, retry protection, and fail-closed degradation. GX, WX, and ADMIN cannot borrow or bypass one another's abuse boundaries.";

export const S07_FROZEN_PRINCIPLE = 'Availability is part of security.';

export const S07_PRINCIPLES = {
  S07_P01_AVAILABILITY_IS_SECURITY:
    'Availability is part of security: Authentication alone does not make an endpoint safe. Uncontrolled resource consumption, worker exhaustion, or expensive queries must be blocked before consuming system resources.',
  S07_P02_SERVER_ENFORCED_ADMISSION:
    'Server-Enforced Admission: Rate limiting and abuse detection are authoritative on the server. Frontend throttling is never considered a security boundary.',
  S07_P03_GX_WX_ADMIN_ABUSE_ISOLATION:
    'Cross-Plane Isolation: GX, WX, and ADMIN occupy independent abuse control planes. No quota or identity borrowing is ever permitted across planes.',
  S07_P04_FAIL_CLOSED_ABUSE_CONTROL:
    'Fail-Closed Abuse Control: If rate limiters or admission controllers experience distress or failure, security-critical endpoints restrict admission rather than allowing unbounded access.',
} as const;

export const S07_INVARIANTS = {
  'S07-I01': {
    id: 'S07-I01',
    title: 'Server-Enforced Rate Limits',
    description: 'Every rate-limited endpoint must enforce limits server-side. Frontend throttling is never a security control.',
    failClosedDecision: 'SERVER_ENFORCED_RATE_LIMIT',
  },
  'S07-I02': {
    id: 'S07-I02',
    title: 'Identity-Aware Limiting',
    description: 'Rate limits distinguish between ANONYMOUS, GUEST, USER, and ADMIN principals.',
    failClosedDecision: 'IDENTITY_AWARE_LIMIT_ENFORCED',
  },
  'S07-I03': {
    id: 'S07-I03',
    title: 'Endpoint-Specific Policies',
    description: 'Different endpoint classes (Login, Register, Understand, CRUD, Admin) enforce tailored rate profiles.',
    failClosedDecision: 'ENDPOINT_POLICY_ENFORCED',
  },
  'S07-I04': {
    id: 'S07-I04',
    title: 'Understanding Job Protection',
    description: 'Infrastructure-understanding jobs require strict quota and concurrency admission control.',
    failClosedDecision: 'JOB_ADMISSION_ENFORCED',
  },
  'S07-I05': {
    id: 'S07-I05',
    title: 'Concurrent Work Limits',
    description: 'Simultaneous expensive operations are capped per principal to prevent worker monopolization.',
    failClosedDecision: 'CONCURRENCY_LIMIT_ENFORCED',
  },
  'S07-I06': {
    id: 'S07-I06',
    title: 'Queue Admission Control',
    description: 'Background queues enforce capacity, per-principal quotas, timeouts, and deduplication.',
    failClosedDecision: 'QUEUE_ADMISSION_ENFORCED',
  },
  'S07-I07': {
    id: 'S07-I07',
    title: 'Retry Amplification Protection',
    description: 'Retries are bounded with exponential backoff and never amplify attacks.',
    failClosedDecision: 'RETRY_CEILING_ENFORCED',
  },
  'S07-I08': {
    id: 'S07-I08',
    title: 'Brute-Force Resistance',
    description: 'Authentication endpoints resist password guessing, credential stuffing, and token guessing.',
    failClosedDecision: 'BRUTE_FORCE_BLOCKED',
  },
  'S07-I09': {
    id: 'S07-I09',
    title: 'Enumeration Resistance',
    description: 'Rate limiting and responses do not create resource existence oracles.',
    failClosedDecision: 'ENUMERATION_ORACLE_PREVENTED',
  },
  'S07-I10': {
    id: 'S07-I10',
    title: 'Distributed Abuse Resistance',
    description: 'Abuse detection correlates IP, session, guest ID, user agent, and principal dimensions.',
    failClosedDecision: 'DISTRIBUTED_ABUSE_BLOCKED',
  },
  'S07-I11': {
    id: 'S07-I11',
    title: 'Resource Exhaustion Protection',
    description: 'Protections exist for CPU, memory, DB connections, worker slots, and payload sizes.',
    failClosedDecision: 'RESOURCE_EXHAUSTION_BLOCKED',
  },
  'S07-I12': {
    id: 'S07-I12',
    title: 'Timeout Enforcement',
    description: 'Every request and background job has an explicit upper execution time bound.',
    failClosedDecision: 'TIMEOUT_ENFORCED',
  },
  'S07-I13': {
    id: 'S07-I13',
    title: 'Global Emergency Protection',
    description: 'Global ceilings, circuit breakers, and overload shedding protect system stability.',
    failClosedDecision: 'EMERGENCY_PROTECTION_ENGAGED',
  },
  'S07-I14': {
    id: 'S07-I14',
    title: '429 Contract',
    description: 'HTTP 429 responses are uniform and never leak internal capacity or worker metrics.',
    failClosedDecision: 'SAFE_429_RESPONSE_CONTRACT',
  },
  'S07-I15': {
    id: 'S07-I15',
    title: 'Fail-Closed Abuse Controls',
    description: 'Unavailable or degraded rate limiters fail closed on sensitive operations.',
    failClosedDecision: 'FAIL_CLOSED_ABUSE_CONTROL',
  },
} as const;

export interface AttackVectorDefinition {
  id: string;
  description: string;
  expectedDecision: string;
}

export const S07_ATTACK_MATRIX: AttackVectorDefinition[] = [
  { id: 'S07-01', description: 'Anonymous request flooding', expectedDecision: 'RATE_LIMIT_EXCEEDED' },
  { id: 'S07-02', description: 'Single IP burst attack', expectedDecision: 'RATE_LIMIT_EXCEEDED' },
  { id: 'S07-03', description: 'Distributed IP flooding', expectedDecision: 'DISTRIBUTED_ABUSE_BLOCKED' },
  { id: 'S07-04', description: 'Guest session flooding', expectedDecision: 'RATE_LIMIT_EXCEEDED' },
  { id: 'S07-05', description: 'Guest session rotation bypass', expectedDecision: 'IP_PRINCIPAL_CORRELATED_BLOCK' },
  { id: 'S07-06', description: 'User request flooding', expectedDecision: 'RATE_LIMIT_EXCEEDED' },
  { id: 'S07-07', description: 'Session rotation bypass', expectedDecision: 'PRINCIPAL_LIMIT_ENFORCED' },
  { id: 'S07-08', description: 'Login brute force', expectedDecision: 'BRUTE_FORCE_BLOCKED' },
  { id: 'S07-09', description: 'Credential stuffing', expectedDecision: 'BRUTE_FORCE_BLOCKED' },
  { id: 'S07-10', description: 'Registration flooding', expectedDecision: 'RATE_LIMIT_EXCEEDED' },
  { id: 'S07-11', description: 'OAuth initiation flooding', expectedDecision: 'RATE_LIMIT_EXCEEDED' },
  { id: 'S07-12', description: 'Refresh endpoint flooding', expectedDecision: 'RATE_LIMIT_EXCEEDED' },
  { id: 'S07-13', description: 'Password-reset flooding', expectedDecision: 'RATE_LIMIT_EXCEEDED' },
  { id: 'S07-14', description: 'Verification-token abuse', expectedDecision: 'BRUTE_FORCE_BLOCKED' },
  { id: 'S07-15', description: 'Guest understand flooding', expectedDecision: 'HOURLY_QUOTA_EXCEEDED' },
  { id: 'S07-16', description: 'Authenticated understand flooding', expectedDecision: 'HOURLY_QUOTA_EXCEEDED' },
  { id: 'S07-17', description: 'Duplicate understand submission', expectedDecision: 'DUPLICATE_SUPPRESSED' },
  { id: 'S07-18', description: 'Concurrent understanding exhaustion', expectedDecision: 'CONCURRENCY_EXCEEDED' },
  { id: 'S07-19', description: 'Worker queue flooding', expectedDecision: 'GLOBAL_CAPACITY_EXCEEDED' },
  { id: 'S07-20', description: 'Global queue exhaustion', expectedDecision: 'SHED_OVERLOAD_CRITICAL' },
  { id: 'S07-21', description: 'Retry amplification', expectedDecision: 'MAX_RETRIES_EXCEEDED' },
  { id: 'S07-22', description: 'Infinite retry loop', expectedDecision: 'MAX_RETRIES_EXCEEDED' },
  { id: 'S07-23', description: 'Long-running job', expectedDecision: 'TIMEOUT_ENFORCED' },
  { id: 'S07-24', description: 'External probe timeout', expectedDecision: 'TIMEOUT_ENFORCED' },
  { id: 'S07-25', description: 'Slow request exhaustion', expectedDecision: 'TIMEOUT_ENFORCED' },
  { id: 'S07-26', description: 'Connection exhaustion', expectedDecision: 'SHED_DB_POOL_SATURATED' },
  { id: 'S07-27', description: 'DB pool exhaustion', expectedDecision: 'SHED_DB_POOL_SATURATED' },
  { id: 'S07-28', description: 'Expensive query flooding', expectedDecision: 'RATE_LIMIT_EXCEEDED' },
  { id: 'S07-29', description: 'Batch request abuse', expectedDecision: 'RATE_LIMIT_EXCEEDED' },
  { id: 'S07-30', description: 'Large valid payload repetition', expectedDecision: 'RATE_LIMIT_EXCEEDED' },
  { id: 'S07-31', description: 'Rate-limit header manipulation', expectedDecision: 'SERVER_ENFORCED_RATE_LIMIT' },
  { id: 'S07-32', description: 'Client-controlled identity for quota', expectedDecision: 'CLIENT_IDENTITY_IGNORED' },
  { id: 'S07-33', description: 'User ID quota bypass', expectedDecision: 'IDENTITY_AWARE_LIMIT_ENFORCED' },
  { id: 'S07-34', description: 'Guest ID quota bypass', expectedDecision: 'IDENTITY_AWARE_LIMIT_ENFORCED' },
  { id: 'S07-35', description: 'Multiple sessions bypass', expectedDecision: 'PRINCIPAL_LIMIT_ENFORCED' },
  { id: 'S07-36', description: 'Multiple accounts bypass', expectedDecision: 'DISTRIBUTED_ABUSE_BLOCKED' },
  { id: 'S07-37', description: 'API direct-call bypass', expectedDecision: 'SERVER_ENFORCED_RATE_LIMIT' },
  { id: 'S07-38', description: 'Frontend throttling bypass', expectedDecision: 'SERVER_ENFORCED_RATE_LIMIT' },
  { id: 'S07-39', description: 'Rate limiter unavailable', expectedDecision: 'FAIL_CLOSED_ABUSE_CONTROL' },
  { id: 'S07-40', description: 'Counter storage unavailable', expectedDecision: 'FAIL_CLOSED_ABUSE_CONTROL' },
  { id: 'S07-41', description: 'Race in rate-limit counter', expectedDecision: 'ATOMIC_DECISION_ENFORCED' },
  { id: 'S07-42', description: 'Concurrent requests bypass limit', expectedDecision: 'ATOMIC_DECISION_ENFORCED' },
  { id: 'S07-43', description: 'Clock manipulation', expectedDecision: 'SERVER_TIME_ENFORCED' },
  { id: 'S07-44', description: 'Enumeration through 429 differences', expectedDecision: 'ENUMERATION_ORACLE_PREVENTED' },
  { id: 'S07-45', description: 'Retry-After information leakage', expectedDecision: 'SAFE_429_RESPONSE_CONTRACT' },
  { id: 'S07-46', description: 'Admin endpoint flooding', expectedDecision: 'RATE_LIMIT_EXCEEDED' },
  { id: 'S07-47', description: 'Cross-plane quota borrowing', expectedDecision: 'CROSS_PLANE_BORROWING_BLOCKED' },
  { id: 'S07-48', description: 'Worker starvation by one principal', expectedDecision: 'CONCURRENCY_EXCEEDED' },
  { id: 'S07-49', description: 'Emergency global overload', expectedDecision: 'EMERGENCY_PROTECTION_ENGAGED' },
  { id: 'S07-50', description: 'Direct API DoS attempt', expectedDecision: 'SERVER_ENFORCED_RATE_LIMIT' },
];

/**
 * Validates the exact S-07 certification statement.
 */
export function verifyS07Certification(statement: string): boolean {
  if (!statement || typeof statement !== 'string') return false;
  const normalized = statement.trim().replace(/\s+/g, ' ');
  return (
    normalized === S07_CERTIFICATION_STATEMENT.trim().replace(/\s+/g, ' ') ||
    normalized === S07_SECONDARY_GATE.trim().replace(/\s+/g, ' ')
  );
}
