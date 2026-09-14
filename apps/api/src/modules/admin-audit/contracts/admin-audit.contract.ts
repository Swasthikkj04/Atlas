/**
 * ADMIN-008: Admin Audit & Security Hardening Contracts
 *
 * Authoritative constants, DTOs, and interfaces for the immutable audit architecture,
 * cryptographic hash chaining, anomaly detection, and emergency lockdown controls.
 */

export const ADMIN_AUDIT_CATEGORIES = {
  AUTHENTICATION: 'AUTHENTICATION',
  SESSION: 'SESSION',
  AUTHORIZATION: 'AUTHORIZATION',
  ADMIN_ACTION: 'ADMIN_ACTION',
  SECURITY_INCIDENT: 'SECURITY_INCIDENT',
  SYSTEM: 'SYSTEM',
} as const;

export type AdminAuditCategory =
  (typeof ADMIN_AUDIT_CATEGORIES)[keyof typeof ADMIN_AUDIT_CATEGORIES];

export const ADMIN_AUDIT_ACTIONS = {
  // Authentication Lifecycle
  ADMIN_WEBAUTHN_AUTHENTICATION_STARTED:
    'ADMIN_WEBAUTHN_AUTHENTICATION_STARTED',
  ADMIN_WEBAUTHN_AUTHENTICATION_FAILED: 'ADMIN_WEBAUTHN_AUTHENTICATION_FAILED',
  ADMIN_WEBAUTHN_AUTHENTICATION_SUCCEEDED:
    'ADMIN_WEBAUTHN_AUTHENTICATION_SUCCEEDED',
  ADMIN_WEBAUTHN_AUTHENTICATOR_REJECTED:
    'ADMIN_WEBAUTHN_AUTHENTICATOR_REJECTED',
  ADMIN_PASSWORD_VERIFIED: 'ADMIN_PASSWORD_VERIFIED',
  ADMIN_PASSWORD_FAILED: 'ADMIN_PASSWORD_FAILED',
  ADMIN_ENROLLMENT_STARTED: 'ADMIN_ENROLLMENT_STARTED',
  ADMIN_ENROLLMENT_SUCCEEDED: 'ADMIN_ENROLLMENT_SUCCEEDED',
  ADMIN_ENROLLMENT_FAILED: 'ADMIN_ENROLLMENT_FAILED',

  // Session Lifecycle
  ADMIN_SESSION_CREATED: 'ADMIN_SESSION_CREATED',
  ADMIN_SESSION_REVOKED: 'ADMIN_SESSION_REVOKED',
  ADMIN_SESSION_EXPIRED: 'ADMIN_SESSION_EXPIRED',
  ADMIN_LOGOUT: 'ADMIN_LOGOUT',
  ADMIN_SESSIONS_REVOKED: 'ADMIN_SESSIONS_REVOKED',
  GLOBAL_SESSIONS_REVOKED: 'GLOBAL_SESSIONS_REVOKED',

  // Authorization Decisions
  ADMIN_AUTHORIZATION_GRANTED: 'ADMIN_AUTHORIZATION_GRANTED',
  ADMIN_AUTHORIZATION_DENIED: 'ADMIN_AUTHORIZATION_DENIED',
  ADMIN_TOKEN_REJECTED: 'ADMIN_TOKEN_REJECTED',
  ADMIN_SESSION_REJECTED: 'ADMIN_SESSION_REJECTED',
  ADMIN_CAPABILITY_DENIED: 'ADMIN_CAPABILITY_DENIED',

  // Operational Administrative Actions
  USER_DISABLED: 'USER_DISABLED',
  USER_SESSION_REVOKED: 'USER_SESSION_REVOKED',
  ADMIN_LOCKDOWN_TRIGGERED: 'ADMIN_LOCKDOWN_TRIGGERED',
  ADMIN_IDENTITY_DISABLED: 'ADMIN_IDENTITY_DISABLED',
  ADMIN_SECURITY_POLICY_UPDATED: 'ADMIN_SECURITY_POLICY_UPDATED',

  // Detection & Security Incidents
  SUSPICIOUS_AUTHENTICATION_BURST: 'SUSPICIOUS_AUTHENTICATION_BURST',
  CRITICAL_AUTHENTICATOR_CLONE_ATTEMPT: 'CRITICAL_AUTHENTICATOR_CLONE_ATTEMPT',
  SUSPICIOUS_UNAUTHORIZED_PROBING: 'SUSPICIOUS_UNAUTHORIZED_PROBING',
  SUSPICIOUS_CONCURRENT_ACCESS: 'SUSPICIOUS_CONCURRENT_ACCESS',
} as const;

export type AdminAuditAction =
  (typeof ADMIN_AUDIT_ACTIONS)[keyof typeof ADMIN_AUDIT_ACTIONS] | string;

export const ADMIN_AUDIT_RETENTION_CLASSES = {
  AUTHENTICATION: 'AUTHENTICATION', // 90 days
  SESSION: 'SESSION', // 90 days
  AUTHORIZATION: 'AUTHORIZATION', // 180 days
  ADMIN_ACTION: 'ADMIN_ACTION', // 365 days
  SECURITY_INCIDENT: 'SECURITY_INCIDENT', // 730 days
} as const;

export type AdminAuditRetentionClass =
  (typeof ADMIN_AUDIT_RETENTION_CLASSES)[keyof typeof ADMIN_AUDIT_RETENTION_CLASSES];

export const RETENTION_DAYS_BY_CLASS: Record<AdminAuditRetentionClass, number> =
  {
    AUTHENTICATION: 90,
    SESSION: 90,
    AUTHORIZATION: 180,
    ADMIN_ACTION: 365,
    SECURITY_INCIDENT: 730,
  };

export interface CreateAdminAuditEventInput {
  adminId?: string | null;
  sessionId?: string | null;
  credentialId?: string | null;
  action: AdminAuditAction;
  category?: AdminAuditCategory;
  retentionClass?: AdminAuditRetentionClass;
  targetType?: string | null;
  targetId?: string | null;
  outcome?: 'SUCCESS' | 'FAILURE';
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
  createdAt?: Date;
}

export interface AdminAuditEventDto {
  id: string;
  adminId?: string | null;
  sessionId?: string | null;
  credentialId?: string | null;
  action: string;
  category: string;
  retentionClass: string;
  targetType?: string | null;
  targetId?: string | null;
  outcome: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
  previousHash?: string | null;
  eventHash?: string | null;
  createdAt: Date;
}

export interface AdminAuditChainVerificationResultDto {
  valid: boolean;
  totalEventsVerified: number;
  genesisHash: string;
  latestHash: string;
  brokenIndex?: number;
  tamperedEventId?: string;
  details?: string;
}

export class AdminAuditQueryDto {
  action?: string;
  outcome?: string;
  category?: string;
  retentionClass?: string;
  page?: number;
  limit?: number;
}

export interface AdminPaginatedAuditDto {
  events: AdminAuditEventDto[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminEmergencyLockdownResultDto {
  success: boolean;
  status: 'DISABLED';
  revokedSessionsCount: number;
  lockdownAt: Date;
  reason: string;
}
