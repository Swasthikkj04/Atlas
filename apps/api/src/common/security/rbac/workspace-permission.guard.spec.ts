import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspacePermissionGuard } from './workspace-permission.guard';
import {
  hasWorkspacePermission,
  WorkspacePermission,
  WorkspaceRole,
} from './workspace-rbac.types';
import { WORKSPACE_PERMISSION_KEY } from './require-permission.decorator';

describe('Workspace RBAC & Permission Guard', () => {
  describe('hasWorkspacePermission', () => {
    it('grants all permissions to OWNER', () => {
      expect(
        hasWorkspacePermission(
          WorkspaceRole.OWNER,
          WorkspacePermission.DOMAIN_CREATE,
        ),
      ).toBe(true);
      expect(
        hasWorkspacePermission(
          WorkspaceRole.OWNER,
          WorkspacePermission.DOMAIN_DELETE,
        ),
      ).toBe(true);
      expect(
        hasWorkspacePermission(
          WorkspaceRole.OWNER,
          WorkspacePermission.UNDERSTANDING_TRIGGER,
        ),
      ).toBe(true);
      expect(
        hasWorkspacePermission(
          WorkspaceRole.OWNER,
          WorkspacePermission.AUDIT_LOG_READ,
        ),
      ).toBe(true);
    });

    it('grants domain create and delete to ADMIN', () => {
      expect(
        hasWorkspacePermission(
          WorkspaceRole.ADMIN,
          WorkspacePermission.DOMAIN_CREATE,
        ),
      ).toBe(true);
      expect(
        hasWorkspacePermission(
          WorkspaceRole.ADMIN,
          WorkspacePermission.DOMAIN_DELETE,
        ),
      ).toBe(true);
    });

    it('allows MEMBER to read and trigger scans, but prevents domain create and delete', () => {
      expect(
        hasWorkspacePermission(
          WorkspaceRole.MEMBER,
          WorkspacePermission.DOMAIN_READ,
        ),
      ).toBe(true);
      expect(
        hasWorkspacePermission(
          WorkspaceRole.MEMBER,
          WorkspacePermission.UNDERSTANDING_TRIGGER,
        ),
      ).toBe(true);
      expect(
        hasWorkspacePermission(
          WorkspaceRole.MEMBER,
          WorkspacePermission.DOMAIN_CREATE,
        ),
      ).toBe(false);
      expect(
        hasWorkspacePermission(
          WorkspaceRole.MEMBER,
          WorkspacePermission.DOMAIN_DELETE,
        ),
      ).toBe(false);
      expect(
        hasWorkspacePermission(
          WorkspaceRole.MEMBER,
          WorkspacePermission.AUDIT_LOG_READ,
        ),
      ).toBe(false);
    });

    it('allows VIEWER only read permissions', () => {
      expect(
        hasWorkspacePermission(
          WorkspaceRole.VIEWER,
          WorkspacePermission.DOMAIN_READ,
        ),
      ).toBe(true);
      expect(
        hasWorkspacePermission(
          WorkspaceRole.VIEWER,
          WorkspacePermission.UNDERSTANDING_READ,
        ),
      ).toBe(true);
      expect(
        hasWorkspacePermission(
          WorkspaceRole.VIEWER,
          WorkspacePermission.UNDERSTANDING_TRIGGER,
        ),
      ).toBe(false);
      expect(
        hasWorkspacePermission(
          WorkspaceRole.VIEWER,
          WorkspacePermission.DOMAIN_CREATE,
        ),
      ).toBe(false);
      expect(
        hasWorkspacePermission(
          WorkspaceRole.VIEWER,
          WorkspacePermission.DOMAIN_DELETE,
        ),
      ).toBe(false);
    });
  });

  describe('WorkspacePermissionGuard', () => {
    let guard: WorkspacePermissionGuard;
    let reflector: jest.Mocked<Reflector>;

    beforeEach(() => {
      reflector = {
        getAllAndOverride: jest.fn(),
      } as any;
      guard = new WorkspacePermissionGuard(reflector);
    });

    const createMockContext = (user: any): ExecutionContext => {
      return {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      } as any;
    };

    it('allows execution when no permission is required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = createMockContext({ id: 'usr-1' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('defaults user without explicit role to OWNER and allows privileged operation', () => {
      reflector.getAllAndOverride.mockReturnValue(
        WorkspacePermission.DOMAIN_DELETE,
      );
      const ctx = createMockContext({ id: 'usr-1' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows ADMIN to delete domain', () => {
      reflector.getAllAndOverride.mockReturnValue(
        WorkspacePermission.DOMAIN_DELETE,
      );
      const ctx = createMockContext({
        id: 'usr-admin',
        workspaceRole: WorkspaceRole.ADMIN,
      });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException when MEMBER attempts to delete domain', () => {
      reflector.getAllAndOverride.mockReturnValue(
        WorkspacePermission.DOMAIN_DELETE,
      );
      const ctx = createMockContext({
        id: 'usr-member',
        workspaceRole: WorkspaceRole.MEMBER,
      });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when no user is attached to request', () => {
      reflector.getAllAndOverride.mockReturnValue(
        WorkspacePermission.DOMAIN_READ,
      );
      const ctx = createMockContext(null);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
