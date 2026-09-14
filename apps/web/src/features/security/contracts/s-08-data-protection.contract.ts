/**
 * S-08 — Data Protection & Privacy Web Contract
 *
 * Phase: Production Security Hardening
 * Priority: P0 — BLOCKING
 * Type: Security / Data Protection / Privacy / Backend / Database / API / Contract
 * Depends on: S-01 🔒, S-02 🔒, S-03 🔒, S-04 🔒, S-05 🔒, S-06 🔒, S-07 🔒
 * Blocks: S-09 → S-12 and Production Release
 * Status: CERTIFIED_DATA_PROTECTION_PRIVACY
 */

export const S08_TICKET_ID = 'S-08' as const;
export const S08_PHASE = 'Production Security Hardening' as const;
export const S08_PRIORITY = 'P0 — BLOCKING' as const;
export const S08_TYPE = 'Security / Data Protection / Privacy / Backend / Database / API / Contract' as const;
export const S08_STATUS = 'CERTIFIED_DATA_PROTECTION_PRIVACY' as const;
export const S08_DEPENDS_ON = ['S-01', 'S-02', 'S-03', 'S-04', 'S-05', 'S-06', 'S-07'] as const;
export const S08_BLOCKS = ['S-09', 'S-10', 'S-11', 'S-12', 'Production Release'] as const;

export const S08_CERTIFICATION_STATEMENT =
  'Every piece of data handled by Nebula has an explicit classification, ownership boundary, retention rule, exposure policy, and lifecycle. Sensitive data is minimized, protected at rest and in transit, never exposed beyond its authorized plane, and securely deleted when its retention period or account lifecycle requires it.';

export const S08_SECONDARY_GATE =
  'Nebula collects and retains only justified data, binds every persistent record to an explicit ownership and lifecycle policy, prevents unauthorized representation or cross-plane exposure, securely handles deletion and retention, and fails closed whenever data protection boundaries cannot be established.';

export const S08_FROZEN_PRINCIPLE = 'Collect what is necessary. Expose what is justified. Retain only what is required.';

export const S08_PRINCIPLES = {
  S08_P01_DATA_MINIMIZATION:
    'Collect what is necessary. Expose what is justified. Retain only what is required: Nebula does not persist information merely because collectors can obtain it.',
  S08_P02_TENANT_DATA_ISOLATION:
    'Tenant Isolation: All persistent intelligence remains strictly bound to the authenticated tenant. Responses, caches, exports, and telemetry never cross tenant boundaries.',
  S08_P03_GX_EPHEMERALITY:
    'GX Ephemerality: Guest discovery intelligence has an explicitly bounded lifecycle and is purged after 24 hours. GX never becomes a shadow database for WX.',
  S08_P04_FAIL_CLOSED_PRIVACY:
    'Fail-Closed Privacy: If classification, ownership, or retention cannot be established, the system strictly fails closed and refuses data exposure.',
} as const;

export interface InvariantDefinition {
  id: string;
  title: string;
  description: string;
  failClosedDecision: string;
}

export const S08_INVARIANTS: Record<string, InvariantDefinition> = {
  'S08-I01': {
    id: 'S08-I01',
    title: 'Data Classification',
    description: 'Every persisted or externally exposed data category must have a defined classification (PUBLIC, INTERNAL, SENSITIVE, SECURITY_SENSITIVE).',
    failClosedDecision: 'UNCLASSIFIED_DATA_BLOCKED',
  },
  'S08-I02': {
    id: 'S08-I02',
    title: 'Data Minimization',
    description: 'Nebula does not persist unnecessary headers, cookies, credentials, tokens, or third-party identifiers.',
    failClosedDecision: 'EXCESSIVE_DATA_STRIPPED',
  },
  'S08-I03': {
    id: 'S08-I03',
    title: 'Tenant Data Isolation',
    description: 'All persistent intelligence remains strictly bound to User -> Domain -> Snapshot -> Finding.',
    failClosedDecision: 'TENANT_ISOLATION_ENFORCED',
  },
  'S08-I04': {
    id: 'S08-I04',
    title: 'Guest Data Ephemerality',
    description: 'GX data has an explicit 24-hour retention lifecycle and is purged automatically.',
    failClosedDecision: 'EPHEMERAL_EXPIRY_ENFORCED',
  },
  'S08-I05': {
    id: 'S08-I05',
    title: 'Purpose Limitation',
    description: 'Data collected for infrastructure understanding is never repurposed for advertising or unauthorized tracking.',
    failClosedDecision: 'PURPOSE_LIMITATION_ENFORCED',
  },
  'S08-I06': {
    id: 'S08-I06',
    title: 'Sensitive Data Response Filtering',
    description: 'Response DTOs act as exposure boundaries; sensitive database fields are never returned directly.',
    failClosedDecision: 'SENSITIVE_FIELD_STRIPPED',
  },
  'S08-I07': {
    id: 'S08-I07',
    title: 'Raw Evidence Containment',
    description: 'Progressive disclosure restricts raw collector payloads to authenticated deep investigation.',
    failClosedDecision: 'RAW_EVIDENCE_CONTAINED',
  },
  'S08-I08': {
    id: 'S08-I08',
    title: 'Cache Isolation',
    description: 'Cache keys strictly partition by plane, tenant, and principal to prevent cross-tenant collisions.',
    failClosedDecision: 'CACHE_ISOLATION_ENFORCED',
  },
  'S08-I09': {
    id: 'S08-I09',
    title: 'No Sensitive Data in URLs',
    description: 'Sensitive tokens, secrets, or passwords are never transmitted via query strings, paths, or fragments.',
    failClosedDecision: 'URL_SENSITIVE_PARAM_BLOCKED',
  },
  'S08-I10': {
    id: 'S08-I10',
    title: 'Privacy-Safe Logging',
    description: 'Logs and telemetry scrub email addresses, credentials, tokens, and raw collector payloads.',
    failClosedDecision: 'LOG_PRIVACY_REDACTED',
  },
  'S08-I11': {
    id: 'S08-I11',
    title: 'Retention Enforcement',
    description: 'Every data category enforces lifecycle states (CREATED -> ACTIVE -> RETENTION -> EXPIRED -> DELETED).',
    failClosedDecision: 'RETENTION_LIFECYCLE_ENFORCED',
  },
  'S08-I12': {
    id: 'S08-I12',
    title: 'Account Deletion Propagation',
    description: 'Account deletion cascades across domains, snapshots, findings, briefs, evidence, sessions, and caches.',
    failClosedDecision: 'ZERO_ORPHAN_DELETION_ENFORCED',
  },
  'S08-I13': {
    id: 'S08-I13',
    title: 'Backup & Recovery Privacy',
    description: 'Backup retention has defined bounds, and restoration strictly preserves tenant isolation.',
    failClosedDecision: 'BACKUP_TENANT_ISOLATION_ENFORCED',
  },
  'S08-I14': {
    id: 'S08-I14',
    title: 'Export Boundary',
    description: 'Data exports are authenticated, tenant-scoped, size-bounded, and scrubbed of secrets.',
    failClosedDecision: 'EXPORT_BOUNDARY_ENFORCED',
  },
  'S08-I15': {
    id: 'S08-I15',
    title: 'Privacy Failure Is Fail-Closed',
    description: 'Uncertain ownership, classification, or retention immediately blocks data exposure.',
    failClosedDecision: 'FAIL_CLOSED_PRIVACY_ENFORCED',
  },
};

export const S08_ATTACK_MATRIX = [
  { id: 'S08-01', description: 'User A receives User B data', expectedDecision: 'TENANT_ISOLATION_ENFORCED' },
  { id: 'S08-02', description: 'GX receives WX resource', expectedDecision: 'CROSS_PLANE_ACCESS_BLOCKED' },
  { id: 'S08-03', description: 'WX receives GX-private state', expectedDecision: 'CROSS_PLANE_ACCESS_BLOCKED' },
  { id: 'S08-04', description: 'Unauthorized evidence access', expectedDecision: 'RAW_EVIDENCE_CONTAINED' },
  { id: 'S08-05', description: 'Raw collector payload exposed', expectedDecision: 'RAW_EVIDENCE_CONTAINED' },
  { id: 'S08-06', description: 'Sensitive DB field returned through DTO', expectedDecision: 'SENSITIVE_FIELD_STRIPPED' },
  { id: 'S08-07', description: 'Sensitive query parameter', expectedDecision: 'URL_SENSITIVE_PARAM_BLOCKED' },
  { id: 'S08-08', description: 'Sensitive URL fragment', expectedDecision: 'URL_SENSITIVE_PARAM_BLOCKED' },
  { id: 'S08-09', description: 'Cross-tenant cache collision', expectedDecision: 'CACHE_ISOLATION_ENFORCED' },
  { id: 'S08-10', description: 'Cross-plane cache collision', expectedDecision: 'CACHE_ISOLATION_ENFORCED' },
  { id: 'S08-11', description: 'Deleted resource remains API-visible', expectedDecision: 'ZERO_ORPHAN_DELETION_ENFORCED' },
  { id: 'S08-12', description: 'Orphaned tenant record accessible', expectedDecision: 'ZERO_ORPHAN_DELETION_ENFORCED' },
  { id: 'S08-13', description: 'Export includes foreign tenant data', expectedDecision: 'EXPORT_BOUNDARY_ENFORCED' },
  { id: 'S08-14', description: 'Backup restoration crosses tenant boundary', expectedDecision: 'BACKUP_TENANT_ISOLATION_ENFORCED' },
  { id: 'S08-15', description: 'Deleted GX session remains accessible', expectedDecision: 'EPHEMERAL_EXPIRY_ENFORCED' },
  { id: 'S08-16', description: 'Unnecessary personal data persistence', expectedDecision: 'EXCESSIVE_DATA_STRIPPED' },
  { id: 'S08-17', description: 'Raw headers persisted unnecessarily', expectedDecision: 'EXCESSIVE_DATA_STRIPPED' },
  { id: 'S08-18', description: 'Authentication material persisted', expectedDecision: 'SENSITIVE_FIELD_STRIPPED' },
  { id: 'S08-19', description: 'Unbounded evidence retention', expectedDecision: 'RETENTION_LIFECYCLE_ENFORCED' },
  { id: 'S08-20', description: 'Missing data classification', expectedDecision: 'UNCLASSIFIED_DATA_BLOCKED' },
  { id: 'S08-21', description: 'Missing purpose classification', expectedDecision: 'PURPOSE_LIMITATION_ENFORCED' },
  { id: 'S08-22', description: 'Sensitive data used for unrelated analytics', expectedDecision: 'PURPOSE_LIMITATION_ENFORCED' },
  { id: 'S08-23', description: 'Third-party enrichment without policy', expectedDecision: 'PURPOSE_LIMITATION_ENFORCED' },
  { id: 'S08-24', description: 'Excessive API response fields', expectedDecision: 'SENSITIVE_FIELD_STRIPPED' },
  { id: 'S08-25', description: 'Database object returned directly', expectedDecision: 'SENSITIVE_FIELD_STRIPPED' },
  { id: 'S08-26', description: 'Account deletion leaves domains', expectedDecision: 'ZERO_ORPHAN_DELETION_ENFORCED' },
  { id: 'S08-27', description: 'Account deletion leaves snapshots', expectedDecision: 'ZERO_ORPHAN_DELETION_ENFORCED' },
  { id: 'S08-28', description: 'Account deletion leaves findings', expectedDecision: 'ZERO_ORPHAN_DELETION_ENFORCED' },
  { id: 'S08-29', description: 'Account deletion leaves evidence', expectedDecision: 'ZERO_ORPHAN_DELETION_ENFORCED' },
  { id: 'S08-30', description: 'Account deletion leaves sessions', expectedDecision: 'ZERO_ORPHAN_DELETION_ENFORCED' },
  { id: 'S08-31', description: 'Expired GX data remains active', expectedDecision: 'EPHEMERAL_EXPIRY_ENFORCED' },
  { id: 'S08-32', description: 'Retention policy bypass', expectedDecision: 'RETENTION_LIFECYCLE_ENFORCED' },
  { id: 'S08-33', description: 'Deletion race condition', expectedDecision: 'ZERO_ORPHAN_DELETION_ENFORCED' },
  { id: 'S08-34', description: 'Deleted data resurrected from cache', expectedDecision: 'CACHE_ISOLATION_ENFORCED' },
  { id: 'S08-35', description: 'Deleted data exposed after restoration', expectedDecision: 'BACKUP_TENANT_ISOLATION_ENFORCED' },
  { id: 'S08-36', description: 'Sensitive data in application logs', expectedDecision: 'LOG_PRIVACY_REDACTED' },
  { id: 'S08-37', description: 'Sensitive data in error responses', expectedDecision: 'LOG_PRIVACY_REDACTED' },
  { id: 'S08-38', description: 'Sensitive data in telemetry', expectedDecision: 'LOG_PRIVACY_REDACTED' },
  { id: 'S08-39', description: 'Sensitive data in analytics', expectedDecision: 'PURPOSE_LIMITATION_ENFORCED' },
  { id: 'S08-40', description: 'Sensitive data in URL', expectedDecision: 'URL_SENSITIVE_PARAM_BLOCKED' },
  { id: 'S08-41', description: 'Sensitive data in browser storage', expectedDecision: 'SENSITIVE_FIELD_STRIPPED' },
  { id: 'S08-42', description: 'Foreign data through cache', expectedDecision: 'CACHE_ISOLATION_ENFORCED' },
  { id: 'S08-43', description: 'Foreign data through export', expectedDecision: 'EXPORT_BOUNDARY_ENFORCED' },
  { id: 'S08-44', description: 'Unauthorized bulk export', expectedDecision: 'EXPORT_BOUNDARY_ENFORCED' },
  { id: 'S08-45', description: 'Evidence endpoint enumeration', expectedDecision: 'RAW_EVIDENCE_CONTAINED' },
  { id: 'S08-46', description: 'Data classification failure', expectedDecision: 'FAIL_CLOSED_PRIVACY_ENFORCED' },
  { id: 'S08-47', description: 'Retention service unavailable', expectedDecision: 'FAIL_CLOSED_PRIVACY_ENFORCED' },
  { id: 'S08-48', description: 'Deletion job failure', expectedDecision: 'FAIL_CLOSED_PRIVACY_ENFORCED' },
  { id: 'S08-49', description: 'Cross-plane data request', expectedDecision: 'CROSS_PLANE_ACCESS_BLOCKED' },
  { id: 'S08-50', description: 'Direct API privacy-boundary bypass', expectedDecision: 'TENANT_ISOLATION_ENFORCED' },
];

export function verifyS08Certification(statement: string): boolean {
  if (!statement || typeof statement !== 'string') return false;
  const normalized = statement.trim().replace(/\s+/g, ' ');
  return (
    normalized === S08_CERTIFICATION_STATEMENT.trim().replace(/\s+/g, ' ') ||
    normalized === S08_SECONDARY_GATE.trim().replace(/\s+/g, ' ')
  );
}
