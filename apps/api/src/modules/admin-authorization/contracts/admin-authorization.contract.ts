import { AdminSessionContext } from '../../admin-session/contracts/admin-session.contract';

/**
 * ADMIN-006: Admin Authorization Contracts
 *
 * Defines the centralized capability model, authorization audit events,
 * and authenticated request contexts for the Admin plane.
 */

export enum AdminCapability {
  ADMIN_DASHBOARD_READ = 'ADMIN_DASHBOARD_READ',
  ADMIN_USER_READ = 'ADMIN_USER_READ',
  ADMIN_USER_MANAGE = 'ADMIN_USER_MANAGE',
  ADMIN_SESSION_READ = 'ADMIN_SESSION_READ',
  ADMIN_SESSION_REVOKE = 'ADMIN_SESSION_REVOKE',
  ADMIN_SECURITY_READ = 'ADMIN_SECURITY_READ',
  ADMIN_SECURITY_MANAGE = 'ADMIN_SECURITY_MANAGE',
  ADMIN_AUDIT_READ = 'ADMIN_AUDIT_READ',
  ADMIN_DOMAIN_READ = 'ADMIN_DOMAIN_READ',
  ADMIN_DOMAIN_MANAGE = 'ADMIN_DOMAIN_MANAGE',
  ADMIN_TRAFFIC_READ = 'ADMIN_TRAFFIC_READ',
  ADMIN_WORKER_MANAGE = 'ADMIN_WORKER_MANAGE',
  ADMIN_RETENTION_MANAGE = 'ADMIN_RETENTION_MANAGE',
}

export const ALL_ADMIN_CAPABILITIES: AdminCapability[] =
  Object.values(AdminCapability);

export enum AdminAuthorizationAuditEvent {
  ADMIN_AUTHORIZATION_GRANTED = 'ADMIN_AUTHORIZATION_GRANTED',
  ADMIN_AUTHORIZATION_DENIED = 'ADMIN_AUTHORIZATION_DENIED',
  ADMIN_SESSION_REJECTED = 'ADMIN_SESSION_REJECTED',
  ADMIN_IDENTITY_REJECTED = 'ADMIN_IDENTITY_REJECTED',
  ADMIN_TOKEN_REJECTED = 'ADMIN_TOKEN_REJECTED',
  ADMIN_CAPABILITY_DENIED = 'ADMIN_CAPABILITY_DENIED',
}

export interface AuthenticatedAdminRequest {
  admin: AdminSessionContext;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  url?: string;
  method?: string;
}
