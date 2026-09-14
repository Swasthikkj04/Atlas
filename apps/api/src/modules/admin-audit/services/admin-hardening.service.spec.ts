import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AdminHardeningService } from './admin-hardening.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminSessionStatus } from '../../admin-session/contracts/admin-session.contract';
import { ADMIN_AUDIT_ACTIONS } from '../contracts/admin-audit.contract';

describe('AdminHardeningService (ADMIN-008)', () => {
  let service: AdminHardeningService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      adminIdentity: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      adminSession: {
        updateMany: jest.fn(),
      },
      adminWebAuthnCredential: {
        updateMany: jest.fn(),
      },
    };

    auditService = {
      recordEvent: jest.fn().mockResolvedValue({ id: 'evt-lockdown' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminHardeningService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: AdminAuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = module.get<AdminHardeningService>(AdminHardeningService);
  });

  describe('triggerEmergencyLockdown', () => {
    it('disables admin identity, revokes all active sessions, and records audit event', async () => {
      prisma.adminIdentity.findUnique.mockResolvedValueOnce({
        id: 'adm-001',
        status: 'ACTIVE',
      });
      prisma.adminSession.updateMany.mockResolvedValueOnce({ count: 4 });
      prisma.adminIdentity.update.mockResolvedValueOnce({
        id: 'adm-001',
        status: 'DISABLED',
      });

      const result = await service.triggerEmergencyLockdown(
        'Suspected credential breach',
        {
          adminId: 'adm-001',
          sessionId: 'sess-001',
          identifier: 'owner',
          assuranceLevel: 'AAL3',
        },
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe('DISABLED');
      expect(result.revokedSessionsCount).toBe(4);
      expect(prisma.adminIdentity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'adm-001' },
          data: expect.objectContaining({ status: 'DISABLED' }),
        }),
      );
      expect(auditService.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: ADMIN_AUDIT_ACTIONS.ADMIN_LOCKDOWN_TRIGGERED,
          adminId: 'adm-001',
        }),
      );
    });

    it('throws NotFoundException if admin identity not found', async () => {
      prisma.adminIdentity.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.triggerEmergencyLockdown('Reason', {
          adminId: 'adm-missing',
          sessionId: 'sess-001',
          identifier: 'owner',
          assuranceLevel: 'AAL3',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyAdminOperationalState', () => {
    it('throws ForbiddenException if admin identity is DISABLED', async () => {
      prisma.adminIdentity.findUnique.mockResolvedValueOnce({
        id: 'adm-001',
        status: 'DISABLED',
        disabledReason: 'Emergency security lockdown',
      });

      await expect(
        service.verifyAdminOperationalState('adm-001'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns operational status when admin identity is ACTIVE', async () => {
      prisma.adminIdentity.findUnique.mockResolvedValueOnce({
        id: 'adm-001',
        status: 'ACTIVE',
      });

      const res = await service.verifyAdminOperationalState('adm-001');
      expect(res.operational).toBe(true);
      expect(res.status).toBe('ACTIVE');
    });
  });

  describe('handleCompromisedPasskey', () => {
    it('revokes the passkey and logs audit event', async () => {
      prisma.adminWebAuthnCredential.updateMany.mockResolvedValueOnce({
        count: 1,
      });

      const res = await service.handleCompromisedPasskey(
        'adm-001',
        'passkey-bad',
        'Physical theft reported',
      );

      expect(res.success).toBe(true);
      expect(prisma.adminWebAuthnCredential.updateMany).toHaveBeenCalledWith({
        where: { adminId: 'adm-001', credentialId: 'passkey-bad' },
        data: expect.objectContaining({ status: 'REVOKED' }),
      });
      expect(auditService.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: ADMIN_AUDIT_ACTIONS.ADMIN_WEBAUTHN_AUTHENTICATOR_REJECTED,
          credentialId: 'passkey-bad',
        }),
      );
    });
  });
});
