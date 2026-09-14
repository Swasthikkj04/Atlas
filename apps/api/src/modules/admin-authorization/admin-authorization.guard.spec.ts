import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { AdminAuthorizationGuard } from './guards/admin-authorization.guard';
import { AdminSessionService } from '../admin-session/services/admin-session.service';
import {
  AdminAuthorizationRequiredException,
  AdminCapabilityDeniedException,
  AdminForbiddenException,
} from './exceptions/admin-authorization.exception';
import {
  AdminJwtExpiredException,
  AdminSessionRevokedException,
  AdminUserJwtCrossoverException,
} from '../admin-session/exceptions/admin-session.exception';
import { AdminCapability } from './contracts/admin-authorization.contract';

describe('ADMIN-006: AdminAuthorizationGuard & Invariants', () => {
  let guard: AdminAuthorizationGuard;
  let adminSessionServiceMock: any;
  let reflectorMock: any;

  const mockAdminContext = {
    adminId: 'adm-00000001',
    identifier: 'platform-owner',
    sessionId: 'ses-00000001',
    assuranceLevel: 'AAL3' as const,
    authenticatedAt: new Date(),
  };

  const createMockContext = (
    headers: Record<string, string> = {},
  ): ExecutionContext => {
    const req: any = {
      headers,
      method: 'GET',
      url: '/api/v1/admin/dashboard',
    };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  };

  beforeEach(async () => {
    adminSessionServiceMock = {
      validateAdminToken: jest.fn(),
    };

    reflectorMock = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthorizationGuard,
        { provide: AdminSessionService, useValue: adminSessionServiceMock },
        { provide: Reflector, useValue: reflectorMock },
      ],
    }).compile();

    guard = module.get<AdminAuthorizationGuard>(AdminAuthorizationGuard);
  });

  describe('1. Valid Token & Session Chain', () => {
    it('grants authorization for valid Bearer token and attaches admin context', async () => {
      adminSessionServiceMock.validateAdminToken.mockResolvedValue(
        mockAdminContext,
      );
      reflectorMock.getAllAndOverride.mockReturnValue([
        AdminCapability.ADMIN_DASHBOARD_READ,
      ]);

      const ctx = createMockContext({
        authorization: 'Bearer valid.admin.jwt',
      });
      const canActivate = await guard.canActivate(ctx);

      expect(canActivate).toBe(true);
      const req = ctx.switchToHttp().getRequest();
      expect(req.admin).toEqual(mockAdminContext);
    });

    it('grants authorization when admin session has explicit matching capability', async () => {
      adminSessionServiceMock.validateAdminToken.mockResolvedValue({
        ...mockAdminContext,
        capabilities: [
          AdminCapability.ADMIN_USER_MANAGE,
          AdminCapability.ADMIN_USER_READ,
        ],
      });
      reflectorMock.getAllAndOverride.mockReturnValue([
        AdminCapability.ADMIN_USER_MANAGE,
      ]);

      const ctx = createMockContext({
        authorization: 'Bearer scoped.admin.jwt',
      });
      const canActivate = await guard.canActivate(ctx);

      expect(canActivate).toBe(true);
    });

    it('denies authorization with AdminCapabilityDeniedException when scoped capability is missing', async () => {
      adminSessionServiceMock.validateAdminToken.mockResolvedValue({
        ...mockAdminContext,
        capabilities: [AdminCapability.ADMIN_DASHBOARD_READ], // Missing ADMIN_USER_MANAGE
      });
      reflectorMock.getAllAndOverride.mockReturnValue([
        AdminCapability.ADMIN_USER_MANAGE,
      ]);

      const ctx = createMockContext({
        authorization: 'Bearer scoped.admin.jwt',
      });
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        AdminCapabilityDeniedException,
      );
    });
  });

  describe('2. Missing or Malformed Headers', () => {
    it('rejects requests with missing Authorization header', async () => {
      const ctx = createMockContext({});
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        AdminAuthorizationRequiredException,
      );
    });

    it('rejects requests with non-Bearer Authorization header', async () => {
      const ctx = createMockContext({ authorization: 'Basic token123' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        AdminAuthorizationRequiredException,
      );
    });
  });

  describe('3. Defense In Depth & Escalation Rejections', () => {
    it('rejects User JWT crossover into Admin plane', async () => {
      adminSessionServiceMock.validateAdminToken.mockRejectedValue(
        new AdminUserJwtCrossoverException(),
      );

      const ctx = createMockContext({ authorization: 'Bearer user.jwt.token' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        AdminUserJwtCrossoverException,
      );
    });

    it('rejects expired Admin JWTs', async () => {
      adminSessionServiceMock.validateAdminToken.mockRejectedValue(
        new AdminJwtExpiredException(),
      );

      const ctx = createMockContext({
        authorization: 'Bearer expired.admin.jwt',
      });
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        AdminJwtExpiredException,
      );
    });

    it('rejects revoked Admin sessions', async () => {
      adminSessionServiceMock.validateAdminToken.mockRejectedValue(
        new AdminSessionRevokedException(),
      );

      const ctx = createMockContext({
        authorization: 'Bearer revoked.admin.jwt',
      });
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        AdminSessionRevokedException,
      );
    });

    it('rejects unknown or unhandled internal errors with fail-closed 403 Forbidden', async () => {
      adminSessionServiceMock.validateAdminToken.mockRejectedValue(
        new Error('Unexpected DB connection failure'),
      );

      const ctx = createMockContext({ authorization: 'Bearer any.admin.jwt' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        AdminForbiddenException,
      );
    });
  });
});
