import { SnapshotController } from './snapshot.controller';
import { InfrastructureSnapshotService } from '../services/infrastructure-snapshot.service';
import { SnapshotDriftForensicsService } from '../services/snapshot-drift-forensics.service';

describe('SnapshotController', () => {
  let controller: SnapshotController;
  let snapshotService: jest.Mocked<InfrastructureSnapshotService>;
  let driftForensicsService: jest.Mocked<SnapshotDriftForensicsService>;

  const mockUser = {
    id: 'user-123',
    fullName: 'Test User',
    email: 'test@example.com',
  };

  const mockRequest = {
    user: mockUser,
  } as any;

  beforeEach(() => {
    snapshotService = {
      getSnapshotsByDomain: jest.fn().mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 1 },
      }),
      getSnapshotById: jest.fn().mockResolvedValue({ id: 'snp-123' }),
    } as any;

    driftForensicsService = {
      computeSnapshotDrift: jest.fn().mockResolvedValue({
        baseSnapshotId: 'snp-base',
        targetSnapshotId: 'snp-target',
        domainId: 'dom-123',
        domainName: 'test.com',
        driftScore: 25,
        riskLevel: 'LOW',
        hasMeaningfulDrift: true,
        totalChangesCount: 2,
        forensicNarrative: [],
        dns: {
          changes: [],
          ipShiftDetected: false,
          nameserverShiftDetected: false,
        },
        tls: { changes: [], issuerChanged: false },
        http: { changes: [], noiseHeadersSuppressed: 0 },
        technology: {
          changes: [],
          addedTechnologies: [],
          removedTechnologies: [],
        },
      }),
    } as any;

    controller = new SnapshotController(snapshotService, driftForensicsService);
  });

  it('delegates getSnapshotsByDomain with user context', async () => {
    const result = await controller.getSnapshotsByDomain(
      mockRequest,
      'dom-123',
      1,
      20,
    );
    expect(snapshotService.getSnapshotsByDomain).toHaveBeenCalledWith(
      'user-123',
      'dom-123',
      1,
      20,
    );
    expect(result.data).toEqual([]);
  });

  it('delegates getSnapshotDiff with user context and optional base snapshot', async () => {
    const result = await controller.getSnapshotDiff(
      mockRequest,
      'dom-123',
      'snp-target',
      'snp-base',
    );
    expect(driftForensicsService.computeSnapshotDrift).toHaveBeenCalledWith(
      'user-123',
      'dom-123',
      'snp-target',
      'snp-base',
    );
    expect(result.driftScore).toBe(25);
    expect(result.targetSnapshotId).toBe('snp-target');
  });

  it('delegates getSnapshotById with user context', async () => {
    const result = await controller.getSnapshotById(mockRequest, 'snp-123');
    expect(snapshotService.getSnapshotById).toHaveBeenCalledWith(
      'user-123',
      'snp-123',
    );
    expect(result.id).toBe('snp-123');
  });
});
