import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import {
  AdminAuditCryptoService,
  GENESIS_HASH,
} from './admin-audit-crypto.service';
import { AdminAnomalyDetectionService } from './admin-anomaly-detection.service';
import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_CATEGORIES,
} from '../contracts/admin-audit.contract';

describe('AdminAuditService (ADMIN-008)', () => {
  let service: AdminAuditService;
  let prisma: any;
  let cryptoService: AdminAuditCryptoService;

  beforeEach(async () => {
    prisma = {
      adminAuditEvent: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuditService,
        AdminAuditCryptoService,
        {
          provide: AdminAnomalyDetectionService,
          useValue: {
            recordAuthFailure: jest.fn(),
            recordCounterAnomaly: jest.fn(),
            recordTokenRejection: jest.fn(),
            recordSessionCreation: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AdminAuditService>(AdminAuditService);
    cryptoService = module.get<AdminAuditCryptoService>(
      AdminAuditCryptoService,
    );
  });

  describe('recordEvent', () => {
    it('creates an audit event linking to previous hash in the chain', async () => {
      prisma.adminAuditEvent.findFirst.mockResolvedValueOnce({
        id: 'evt-prev-001',
        eventHash:
          'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
      });

      prisma.adminAuditEvent.create.mockImplementation((args: any) => ({
        id: 'evt-new-002',
        ...args.data,
      }));

      const result = await service.recordEvent({
        adminId: 'adm-001',
        action: ADMIN_AUDIT_ACTIONS.ADMIN_WEBAUTHN_AUTHENTICATION_SUCCEEDED,
        category: ADMIN_AUDIT_CATEGORIES.AUTHENTICATION,
        outcome: 'SUCCESS',
        metadata: { ip: '127.0.0.1' },
      });

      expect(result.id).toBe('evt-new-002');
      expect(result.previousHash).toBe(
        'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
      );
      expect(result.eventHash).toHaveLength(64);
      expect(prisma.adminAuditEvent.create).toHaveBeenCalledTimes(1);
    });

    it('uses GENESIS_HASH when recording the first event in the database', async () => {
      prisma.adminAuditEvent.findFirst.mockResolvedValueOnce(null);

      prisma.adminAuditEvent.create.mockImplementation((args: any) => ({
        id: 'evt-first',
        ...args.data,
      }));

      const result = await service.recordEvent({
        action: ADMIN_AUDIT_ACTIONS.ADMIN_SESSION_CREATED,
        category: ADMIN_AUDIT_CATEGORIES.SESSION,
      });

      expect(result.previousHash).toBe(GENESIS_HASH);
      expect(result.eventHash).toHaveLength(64);
    });
  });

  describe('verifyAuditChainIntegrity', () => {
    it('validates unbroken chain of events from database', async () => {
      const date1 = new Date('2026-08-29T10:00:00.000Z');
      const hash1 = cryptoService.computeEventHash({
        previousHash: GENESIS_HASH,
        action: 'ACTION_1',
        category: 'SECURITY',
        outcome: 'SUCCESS',
        createdAt: date1,
      });

      const date2 = new Date('2026-08-29T10:01:00.000Z');
      const hash2 = cryptoService.computeEventHash({
        previousHash: hash1,
        action: 'ACTION_2',
        category: 'SECURITY',
        outcome: 'SUCCESS',
        createdAt: date2,
      });

      prisma.adminAuditEvent.findMany.mockResolvedValueOnce([
        {
          id: 'evt-1',
          action: 'ACTION_1',
          category: 'SECURITY',
          retentionClass: 'SECURITY',
          outcome: 'SUCCESS',
          previousHash: GENESIS_HASH,
          eventHash: hash1,
          createdAt: date1,
        },
        {
          id: 'evt-2',
          action: 'ACTION_2',
          category: 'SECURITY',
          retentionClass: 'SECURITY',
          outcome: 'SUCCESS',
          previousHash: hash1,
          eventHash: hash2,
          createdAt: date2,
        },
      ]);

      const report = await service.verifyAuditChainIntegrity();
      expect(report.valid).toBe(true);
      expect(report.totalEventsVerified).toBe(2);
      expect(report.latestHash).toBe(hash2);
    });
  });

  describe('cleanupExpiredEvents', () => {
    it('deletes events older than retention class policies', async () => {
      prisma.adminAuditEvent.deleteMany.mockResolvedValue({ count: 12 });

      const result = await service.cleanupExpiredEvents();
      expect(result.deletedCount).toBe(60); // 12 * 5 classes
      expect(prisma.adminAuditEvent.deleteMany).toHaveBeenCalledTimes(5);
    });
  });
});
