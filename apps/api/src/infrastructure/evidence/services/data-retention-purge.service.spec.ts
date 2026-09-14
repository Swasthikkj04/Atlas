import { ConfigService } from '@nestjs/config';
import { DataRetentionPurgeService } from './data-retention-purge.service';
import { EvidenceRepository } from '../repositories/evidence.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { TIER_RETENTION_POLICIES } from '../contracts/evidence-retention.interface';

describe('DataRetentionPurgeService', () => {
  let service: DataRetentionPurgeService;
  let prismaMock: any;
  let evidenceRepoMock: any;
  let configMock: any;

  beforeEach(() => {
    prismaMock = {
      guestSession: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      infrastructureSnapshot: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    evidenceRepoMock = {
      findExpiredEvidence: jest.fn(),
      countExpiredEvidence: jest.fn(),
      deleteEvidenceBatch: jest.fn(),
      getEvidenceStorageStats: jest.fn(),
    };

    configMock = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'AUTO_DATA_PURGE_ENABLED') return 'false';
        return undefined;
      }),
    };

    service = new DataRetentionPurgeService(
      prismaMock,
      evidenceRepoMock,
      configMock,
    );
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('1. Granular Tier Retention Policies', () => {
    it('returns authoritative retention bounds across tiers', () => {
      const guestPolicy = service.getTierPolicy('GUEST');
      expect(guestPolicy.rawEvidenceDays).toBe(1);
      expect(guestPolicy.guestSessionHours).toBe(24);

      const freePolicy = service.getTierPolicy('FREE');
      expect(freePolicy.rawEvidenceDays).toBe(7);
      expect(freePolicy.snapshotDays).toBe(14);

      const proPolicy = service.getTierPolicy('PRO');
      expect(proPolicy.rawEvidenceDays).toBe(30);
      expect(proPolicy.snapshotDays).toBe(90);

      const enterprisePolicy = service.getTierPolicy('ENTERPRISE');
      expect(enterprisePolicy.rawEvidenceDays).toBe(90);
      expect(enterprisePolicy.snapshotDays).toBe(365);
    });
  });

  describe('2. Storage Footprint Calculation', () => {
    it('calculates storage footprint, expired evidence, and reclaimable bytes', async () => {
      evidenceRepoMock.getEvidenceStorageStats.mockResolvedValue({
        totalCount: 100,
        totalSizeBytes: 10_000_000,
        compressedSizeBytes: 2_500_000,
        oldestDate: new Date('2026-01-01'),
        newestDate: new Date('2026-09-01'),
      });
      evidenceRepoMock.countExpiredEvidence.mockResolvedValue(40);

      const footprint = await service.getStorageFootprint('dom_123', 'FREE');

      expect(footprint.totalEvidenceRecords).toBe(100);
      expect(footprint.totalEvidenceBytes).toBe(10_000_000);
      expect(footprint.expiredEvidenceCount).toBe(40);
      expect(footprint.estimatedReclaimableBytes).toBe(4_000_000);
      expect(footprint.tierPolicy.rawEvidenceDays).toBe(7);
    });
  });

  describe('3. Automated Raw Evidence Purging', () => {
    it('executes live purge of expired raw evidence and returns SHA-256 audit proof', async () => {
      const mockExpired = [
        { id: 'ev_1', sizeBytes: 5000, capturedAt: new Date('2026-08-01') },
        { id: 'ev_2', sizeBytes: 7000, capturedAt: new Date('2026-08-02') },
      ];

      evidenceRepoMock.findExpiredEvidence.mockResolvedValue(mockExpired);
      evidenceRepoMock.deleteEvidenceBatch.mockResolvedValue(2);

      const result = await service.purgeExpiredRawEvidence({
        domainId: 'dom_123',
        tier: 'FREE',
        dryRun: false,
      });

      expect(result.category).toBe('RAW_EVIDENCE');
      expect(result.evaluatedCount).toBe(2);
      expect(result.purgedCount).toBe(2);
      expect(result.reclaimedBytes).toBe(12000);
      expect(result.dryRun).toBe(false);
      expect(result.auditProofSha256).toBeDefined();
      expect(result.auditProofSha256.length).toBe(64);
      expect(evidenceRepoMock.deleteEvidenceBatch).toHaveBeenCalledWith([
        'ev_1',
        'ev_2',
      ]);
    });

    it('supports dry-run preview without deleting records', async () => {
      const mockExpired = [
        { id: 'ev_3', sizeBytes: 15000, capturedAt: new Date('2026-08-01') },
      ];

      evidenceRepoMock.findExpiredEvidence.mockResolvedValue(mockExpired);

      const result = await service.purgeExpiredRawEvidence({
        domainId: 'dom_123',
        tier: 'PRO',
        dryRun: true,
      });

      expect(result.evaluatedCount).toBe(1);
      expect(result.purgedCount).toBe(1);
      expect(result.reclaimedBytes).toBe(15000);
      expect(result.dryRun).toBe(true);
      expect(evidenceRepoMock.deleteEvidenceBatch).not.toHaveBeenCalled();
    });
  });

  describe('4. Ephemeral 24-Hour Guest Session Purging', () => {
    it('purges expired guest sessions older than 24 hours', async () => {
      prismaMock.guestSession.findMany.mockResolvedValue([
        { id: 'gst_sess_1' },
        { id: 'gst_sess_2' },
      ]);
      prismaMock.guestSession.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.purgeExpiredGuestSessions({ dryRun: false });

      expect(result.category).toBe('GUEST_SESSION');
      expect(result.purgedCount).toBe(2);
      expect(prismaMock.guestSession.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['gst_sess_1', 'gst_sess_2'] } },
      });
    });
  });

  describe('5. Full Lifecycle Purge Runner', () => {
    it('runs comprehensive purge across evidence, guests, and snapshots', async () => {
      evidenceRepoMock.findExpiredEvidence.mockResolvedValue([]);
      prismaMock.guestSession.findMany.mockResolvedValue([]);
      prismaMock.infrastructureSnapshot.findMany.mockResolvedValue([]);

      const fullResult = await service.runFullLifecyclePurge({
        tier: 'FREE',
        dryRun: false,
      });

      expect(fullResult.results.length).toBe(3);
      expect(fullResult.totalPurged).toBe(0);
      expect(fullResult.executedAt).toBeDefined();
    });
  });
});
