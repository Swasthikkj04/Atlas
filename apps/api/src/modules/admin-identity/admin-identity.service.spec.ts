import { Test, TestingModule } from '@nestjs/testing';
import { AdminIdentityService } from './services/admin-identity.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AdminStatus } from './contracts/admin-identity.contract';
import {
  AdminAlreadyProvisionedException,
  AdminNotProvisionedException,
  AdminDisabledException,
  AdminInvariantViolationException,
} from './exceptions/admin-identity.exception';

describe('ADMIN-001: AdminIdentityService & Owner-Exclusive Invariants', () => {
  let service: AdminIdentityService;
  let prismaMock: any;

  const mockAdminRecord = {
    id: 'a1111111-1111-1111-1111-111111111111',
    identifier: 'platform-owner',
    status: 'ACTIVE',
    authMetadata: { enrollmentPhase: 'ADMIN-001' },
    lastAuthenticatedAt: null,
    disabledAt: null,
    disabledReason: null,
    createdAt: new Date('2026-08-20T00:00:00Z'),
    updatedAt: new Date('2026-08-20T00:00:00Z'),
  };

  beforeEach(async () => {
    prismaMock = {
      adminIdentity: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminIdentityService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AdminIdentityService>(AdminIdentityService);
  });

  describe('1. Owner-Exclusive Provisioning Invariant', () => {
    it('successfully provisions the single owner Admin identity when 0 admins exist', async () => {
      prismaMock.adminIdentity.count.mockResolvedValue(0);
      prismaMock.adminIdentity.create.mockResolvedValue(mockAdminRecord);

      const result = await service.provisionAdminIdentity({
        identifier: 'platform-owner',
        authMetadata: { enrollmentPhase: 'ADMIN-001' },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAdminRecord.id);
      expect(result.identifier).toBe('platform-owner');
      expect(result.status).toBe(AdminStatus.ACTIVE);
      expect(prismaMock.adminIdentity.count).toHaveBeenCalledTimes(1);
      expect(prismaMock.adminIdentity.create).toHaveBeenCalledWith({
        data: {
          identifier: 'platform-owner',
          status: AdminStatus.ACTIVE,
          authMetadata: { enrollmentPhase: 'ADMIN-001' },
        },
      });
    });

    it('strictly rejects provisioning when an Admin identity already exists (Exactly 1 Admin Invariant)', async () => {
      prismaMock.adminIdentity.count.mockResolvedValue(1);

      await expect(
        service.provisionAdminIdentity({
          identifier: 'second-admin',
        }),
      ).rejects.toThrow(AdminAlreadyProvisionedException);

      expect(prismaMock.adminIdentity.create).not.toHaveBeenCalled();
    });

    it('throws AdminInvariantViolationException if count exceeds maximum 1', async () => {
      prismaMock.adminIdentity.count.mockResolvedValue(2);

      await expect(
        service.provisionAdminIdentity({
          identifier: 'third-admin',
        }),
      ).rejects.toThrow(AdminInvariantViolationException);
    });
  });

  describe('2. Querying Authoritative Admin Identity', () => {
    it('returns the single Admin identity when provisioned', async () => {
      prismaMock.adminIdentity.findFirst.mockResolvedValue(mockAdminRecord);

      const admin = await service.getAdminIdentity();
      expect(admin).toBeDefined();
      expect(admin?.id).toBe(mockAdminRecord.id);
      expect(admin?.identifier).toBe('platform-owner');
    });

    it('returns null when no Admin identity is provisioned', async () => {
      prismaMock.adminIdentity.findFirst.mockResolvedValue(null);

      const admin = await service.getAdminIdentity();
      expect(admin).toBeNull();
    });

    it('throws AdminNotProvisionedException on getRequiredAdminIdentity when unprovisioned', async () => {
      prismaMock.adminIdentity.findFirst.mockResolvedValue(null);

      await expect(service.getRequiredAdminIdentity()).rejects.toThrow(
        AdminNotProvisionedException,
      );
    });
  });

  describe('3. Lifecycle State & Secure Disabling', () => {
    it('disables the Admin identity and records timestamp and reason', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminRecord);
      prismaMock.adminIdentity.update.mockResolvedValue({
        ...mockAdminRecord,
        status: 'DISABLED',
        disabledAt: new Date('2026-08-29T12:00:00Z'),
        disabledReason: 'Emergency security lockdown',
      });

      const updated = await service.disableAdminIdentity(
        mockAdminRecord.id,
        'Emergency security lockdown',
      );

      expect(updated.status).toBe(AdminStatus.DISABLED);
      expect(updated.disabledReason).toBe('Emergency security lockdown');
      expect(prismaMock.adminIdentity.update).toHaveBeenCalledWith({
        where: { id: mockAdminRecord.id },
        data: {
          status: AdminStatus.DISABLED,
          disabledAt: expect.any(Date),
          disabledReason: 'Emergency security lockdown',
        },
      });
    });

    it('enables / restores the Admin identity to ACTIVE status', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue({
        ...mockAdminRecord,
        status: 'DISABLED',
        disabledAt: new Date('2026-08-29T12:00:00Z'),
        disabledReason: 'Lockdown',
      });
      prismaMock.adminIdentity.update.mockResolvedValue({
        ...mockAdminRecord,
        status: 'ACTIVE',
        disabledAt: null,
        disabledReason: null,
      });

      const restored = await service.enableAdminIdentity(mockAdminRecord.id);

      expect(restored.status).toBe(AdminStatus.ACTIVE);
      expect(restored.disabledAt).toBeNull();
      expect(restored.disabledReason).toBeNull();
      expect(prismaMock.adminIdentity.update).toHaveBeenCalledWith({
        where: { id: mockAdminRecord.id },
        data: {
          status: AdminStatus.ACTIVE,
          disabledAt: null,
          disabledReason: null,
        },
      });
    });
  });

  describe('4. Fail-Closed Authentication Eligibility Validation', () => {
    it('passes eligibility when Admin identity is ACTIVE', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminRecord);

      const validated = await service.validateAuthenticationEligibility(
        mockAdminRecord.id,
      );
      expect(validated.id).toBe(mockAdminRecord.id);
      expect(validated.status).toBe(AdminStatus.ACTIVE);
    });

    it('fails closed and throws AdminDisabledException when Admin identity is DISABLED', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue({
        ...mockAdminRecord,
        status: 'DISABLED',
        disabledReason: 'Maintenance',
      });

      await expect(
        service.validateAuthenticationEligibility(mockAdminRecord.id),
      ).rejects.toThrow(AdminDisabledException);
    });

    it('fails with AdminNotProvisionedException when identity does not exist in DB', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue(null);

      await expect(
        service.validateAuthenticationEligibility('non-existent-id'),
      ).rejects.toThrow(AdminNotProvisionedException);
    });
  });

  describe('5. Audit & Metadata Updates', () => {
    it('records lastAuthenticatedAt timestamp on successful authentication', async () => {
      const authTime = new Date('2026-08-29T20:00:00Z');
      prismaMock.adminIdentity.update.mockResolvedValue({
        ...mockAdminRecord,
        lastAuthenticatedAt: authTime,
      });

      const updated = await service.recordAuthenticationSuccess(
        mockAdminRecord.id,
      );
      expect(updated.lastAuthenticatedAt).toEqual(authTime);
      expect(prismaMock.adminIdentity.update).toHaveBeenCalledWith({
        where: { id: mockAdminRecord.id },
        data: { lastAuthenticatedAt: expect.any(Date) },
      });
    });

    it('updates authentication metadata for upcoming credential phases', async () => {
      const newMeta = { passkeyEnrolled: true, version: 2 };
      prismaMock.adminIdentity.findUnique.mockResolvedValue(mockAdminRecord);
      prismaMock.adminIdentity.update.mockResolvedValue({
        ...mockAdminRecord,
        authMetadata: newMeta,
      });

      const updated = await service.updateAuthMetadata(
        mockAdminRecord.id,
        newMeta,
      );
      expect(updated.authMetadata).toEqual(newMeta);
    });
  });
});
