import { DataRetentionController } from './data-retention.controller';
import { DataRetentionPurgeService } from '../services/data-retention-purge.service';

describe('DataRetentionController', () => {
  let controller: DataRetentionController;
  let serviceMock: jest.Mocked<DataRetentionPurgeService>;

  beforeEach(() => {
    serviceMock = {
      getTierPolicy: jest.fn().mockReturnValue({
        tier: 'PRO',
        rawEvidenceDays: 30,
        snapshotDays: 90,
        changeHistoryDays: 180,
        guestSessionHours: 24,
        auditLogDays: 365,
      }),
      getStorageFootprint: jest.fn().mockResolvedValue({
        totalEvidenceRecords: 50,
        totalEvidenceBytes: 5_000_000,
        compressedEvidenceBytes: 1_200_000,
        expiredEvidenceCount: 10,
        estimatedReclaimableBytes: 1_000_000,
        tierPolicy: { tier: 'PRO', rawEvidenceDays: 30 },
      }),
      purgeExpiredRawEvidence: jest.fn().mockResolvedValue({
        category: 'RAW_EVIDENCE',
        evaluatedCount: 10,
        purgedCount: 10,
        reclaimedBytes: 1_000_000,
        cutoffDate: new Date(),
        executionDurationMs: 45,
        dryRun: false,
        auditProofSha256: 'mock_sha256_hash_12345',
      }),
    } as unknown as jest.Mocked<DataRetentionPurgeService>;

    controller = new DataRetentionController(serviceMock);
  });

  describe('GET /workspace/retention/policy', () => {
    it('returns retention policy for user tier', () => {
      const req: any = { user: { tier: 'PRO' } };
      const res = controller.getRetentionPolicy(req);

      expect(res.tier).toBe('PRO');
      expect(res.policy.rawEvidenceDays).toBe(30);
      expect(serviceMock.getTierPolicy).toHaveBeenCalledWith('PRO');
    });
  });

  describe('GET /workspace/retention/footprint', () => {
    it('returns storage footprint and aging metrics', async () => {
      const req: any = { user: { tier: 'PRO' } };
      const res = await controller.getStorageFootprint(req, 'dom_123');

      expect(res.totalEvidenceRecords).toBe(50);
      expect(res.expiredEvidenceCount).toBe(10);
      expect(serviceMock.getStorageFootprint).toHaveBeenCalledWith(
        'dom_123',
        'PRO',
      );
    });
  });

  describe('POST /workspace/retention/preview', () => {
    it('invokes dry-run purge preview', async () => {
      const req: any = { user: { tier: 'PRO' } };
      await controller.previewPurge(req, 'dom_123');

      expect(serviceMock.purgeExpiredRawEvidence).toHaveBeenCalledWith({
        domainId: 'dom_123',
        tier: 'PRO',
        dryRun: true,
      });
    });
  });

  describe('POST /workspace/retention/purge', () => {
    it('executes live purge and returns audit receipt', async () => {
      const req: any = { user: { tier: 'PRO' } };
      const res = await controller.executePurge(req, 'dom_123');

      expect(res.purgedCount).toBe(10);
      expect(res.auditProofSha256).toBeDefined();
      expect(serviceMock.purgeExpiredRawEvidence).toHaveBeenCalledWith({
        domainId: 'dom_123',
        tier: 'PRO',
        dryRun: false,
      });
    });
  });
});
