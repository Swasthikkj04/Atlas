/**
 * ADMIN-005: Admin Session & JWT Contracts
 *
 * Establishes cryptographic token claims, session lifecycle policies,
 * key rotation constants, and audit event definitions for the dedicated Admin plane.
 */

export enum AdminSessionStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export enum AdminSessionAuditEvent {
  ADMIN_SESSION_CREATED = 'ADMIN_SESSION_CREATED',
  ADMIN_SESSION_REVOKED = 'ADMIN_SESSION_REVOKED',
  ADMIN_SESSION_EXPIRED = 'ADMIN_SESSION_EXPIRED',
  ADMIN_LOGOUT = 'ADMIN_LOGOUT',
  ADMIN_JWT_ISSUED = 'ADMIN_JWT_ISSUED',
  ADMIN_JWT_REJECTED = 'ADMIN_JWT_REJECTED',
  ADMIN_SESSION_REVOKED_ALL = 'ADMIN_SESSION_REVOKED_ALL',
}

export interface AdminAuthPolicyConfig {
  readonly issuer: string;
  readonly audience: string;
  readonly tokenType: string;
  readonly jwtTtlSeconds: number;
  readonly sessionTtlSeconds: number;
  readonly activeKeyId: string;
}

export const ADMIN_AUTH_POLICY: AdminAuthPolicyConfig = {
  issuer: 'nebula-admin',
  audience: 'nebula-admin-api',
  tokenType: 'admin-access',
  jwtTtlSeconds: 900, // 15 minutes (short-lived access)
  sessionTtlSeconds: 28800, // 8 hours
  activeKeyId: 'admin-key-v1',
} as const;

export interface AdminJwtPayload {
  readonly iss: string;
  readonly aud: string;
  readonly typ: 'admin-access';
  readonly sub: string; // adminIdentityId
  readonly sid: string; // adminSessionId
  readonly identifier: string;
  readonly aal: 'AAL3';
  readonly kid: string;
  readonly iat?: number;
  readonly exp?: number;
}

export interface AdminSessionContext {
  readonly adminId: string;
  readonly identifier: string;
  readonly sessionId: string;
  readonly assuranceLevel: 'AAL3';
  readonly authenticatedAt: Date;
  readonly capabilities?: string[];
}

export interface AdminSessionDto {
  readonly id: string;
  readonly adminId: string;
  readonly credentialId?: string | null;
  readonly status: AdminSessionStatus;
  readonly assuranceLevel: string;
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
  readonly expiresAt: Date;
  readonly lastActiveAt: Date;
  readonly createdAt: Date;
}

export interface AdminTokenResponse {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
  readonly sessionId: string;
  readonly assuranceLevel: 'AAL3';
}
