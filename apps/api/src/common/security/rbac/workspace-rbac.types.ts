/**
 * Workspace RBAC Roles and Permissions
 * Enforces strict multi-tenancy isolation and role-based access control.
 */

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum WorkspacePermission {
  DOMAIN_READ = 'domain:read',
  DOMAIN_CREATE = 'domain:create',
  DOMAIN_UPDATE = 'domain:update',
  DOMAIN_DELETE = 'domain:delete',
  DRIFT_ALERT_MANAGE = 'drift_alert:manage',
  UNDERSTANDING_TRIGGER = 'understanding:trigger',
  UNDERSTANDING_READ = 'understanding:read',
  AUDIT_LOG_READ = 'audit:read',
  WORKSPACE_SETTINGS_MANAGE = 'settings:manage',
}

/**
 * Authoritative role-to-permissions mapping matrix.
 */
export const WORKSPACE_ROLE_PERMISSIONS: Record<
  WorkspaceRole,
  WorkspacePermission[]
> = {
  [WorkspaceRole.OWNER]: [
    WorkspacePermission.DOMAIN_READ,
    WorkspacePermission.DOMAIN_CREATE,
    WorkspacePermission.DOMAIN_UPDATE,
    WorkspacePermission.DOMAIN_DELETE,
    WorkspacePermission.DRIFT_ALERT_MANAGE,
    WorkspacePermission.UNDERSTANDING_TRIGGER,
    WorkspacePermission.UNDERSTANDING_READ,
    WorkspacePermission.AUDIT_LOG_READ,
    WorkspacePermission.WORKSPACE_SETTINGS_MANAGE,
  ],
  [WorkspaceRole.ADMIN]: [
    WorkspacePermission.DOMAIN_READ,
    WorkspacePermission.DOMAIN_CREATE,
    WorkspacePermission.DOMAIN_UPDATE,
    WorkspacePermission.DOMAIN_DELETE,
    WorkspacePermission.DRIFT_ALERT_MANAGE,
    WorkspacePermission.UNDERSTANDING_TRIGGER,
    WorkspacePermission.UNDERSTANDING_READ,
    WorkspacePermission.AUDIT_LOG_READ,
    WorkspacePermission.WORKSPACE_SETTINGS_MANAGE,
  ],
  [WorkspaceRole.MEMBER]: [
    WorkspacePermission.DOMAIN_READ,
    WorkspacePermission.DOMAIN_UPDATE,
    WorkspacePermission.DRIFT_ALERT_MANAGE,
    WorkspacePermission.UNDERSTANDING_TRIGGER,
    WorkspacePermission.UNDERSTANDING_READ,
  ],
  [WorkspaceRole.VIEWER]: [
    WorkspacePermission.DOMAIN_READ,
    WorkspacePermission.UNDERSTANDING_READ,
  ],
};

/**
 * Checks whether a given role has the required permission.
 */
export function hasWorkspacePermission(
  role: WorkspaceRole,
  permission: WorkspacePermission,
): boolean {
  const permissions = WORKSPACE_ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
