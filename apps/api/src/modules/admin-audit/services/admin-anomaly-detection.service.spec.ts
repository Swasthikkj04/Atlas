import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AdminAnomalyDetectionService } from './admin-anomaly-detection.service';
import { AdminAuditCryptoService } from './admin-audit-crypto.service';
import { ADMIN_AUDIT_ACTIONS } from '../contracts/admin-audit.contract';

describe('AdminAnomalyDetectionService (ADMIN-008)', () => {
  let service: AdminAnomalyDetectionService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      adminAuditEvent: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'evt-incident' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAnomalyDetectionService,
        AdminAuditCryptoService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AdminAnomalyDetectionService>(
      AdminAnomalyDetectionService,
    );
  });

  describe('recordAuthFailure', () => {
    it('triggers SUSPICIOUS_AUTHENTICATION_BURST when 5 failures occur within window', async () => {
      const identifier = 'adm-platform-owner';
      const ip = '198.51.100.25';

      for (let i = 0; i < 4; i++) {
        await service.recordAuthFailure(identifier, ip);
      }
      expect(service.getAnomalyMetrics().suspiciousBurstCount).toBe(0);
      expect(prisma.adminAuditEvent.create).not.toHaveBeenCalled();

      // 5th failure triggers anomaly
      await service.recordAuthFailure(identifier, ip);
      expect(service.getAnomalyMetrics().suspiciousBurstCount).toBe(1);
      expect(prisma.adminAuditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: ADMIN_AUDIT_ACTIONS.SUSPICIOUS_AUTHENTICATION_BURST,
            ipAddress: ip,
          }),
        }),
      );
    });
  });

  describe('recordCounterAnomaly', () => {
    it('immediately logs CRITICAL_AUTHENTICATOR_CLONE_ATTEMPT for counter rollback', async () => {
      await service.recordCounterAnomaly(
        'adm-001',
        'passkey-001',
        BigInt(10),
        BigInt(7),
        '203.0.113.50',
      );

      expect(service.getAnomalyMetrics().cloneAttemptsCount).toBe(1);
      expect(prisma.adminAuditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: ADMIN_AUDIT_ACTIONS.CRITICAL_AUTHENTICATOR_CLONE_ATTEMPT,
            adminId: 'adm-001',
            credentialId: 'passkey-001',
            outcome: 'FAILURE',
          }),
        }),
      );
    });
  });

  describe('recordTokenRejection', () => {
    it('triggers SUSPICIOUS_UNAUTHORIZED_PROBING when threshold exceeded', async () => {
      const ip = '192.0.2.100';

      for (let i = 0; i < 4; i++) {
        await service.recordTokenRejection(ip, 'FORGED_JWT');
      }
      expect(service.getAnomalyMetrics().unauthorizedProbingCount).toBe(0);

      await service.recordTokenRejection(ip, 'FORGED_JWT');
      expect(service.getAnomalyMetrics().unauthorizedProbingCount).toBe(1);
      expect(prisma.adminAuditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: ADMIN_AUDIT_ACTIONS.SUSPICIOUS_UNAUTHORIZED_PROBING,
            ipAddress: ip,
          }),
        }),
      );
    });
  });
});
