import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { DiscoveryRegistryService } from '../../infrastructure/discovery/registry/discovery-registry.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureBriefService } from '../infrastructure-brief/services/infrastructure-brief.service';
import { InfrastructureFindingService } from '../infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureSnapshotService } from '../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureVerificationService } from './services/infrastructure-verification.service';
import { SnapshotEqualityEngine } from './services/snapshot-equality.engine';
import { UnderstandingEngine } from './understanding.engine';

describe('UnderstandingEngine', () => {
  let engine: UnderstandingEngine;
  let discoveryRegistry: jest.Mocked<DiscoveryRegistryService>;
  let snapshotService: jest.Mocked<InfrastructureSnapshotService>;
  let findingRuleEngine: jest.Mocked<FindingRuleEngineService>;
  let infrastructureFindingService: jest.Mocked<InfrastructureFindingService>;
  let infrastructureBriefService: jest.Mocked<InfrastructureBriefService>;
  let snapshotEqualityEngine: jest.Mocked<SnapshotEqualityEngine>;
  let verificationService: jest.Mocked<InfrastructureVerificationService>;

  const mockSnapshot: DiscoverySnapshot = {
    http: {
      reachable: true,
      url: 'https://example.com',
      finalUrl: 'https://example.com/',
      protocol: 'https',
      statusCode: 200,
      responseTimeMs: 100,
      headers: { server: 'nginx' },
      redirects: [],
      redirectCount: 0,
      error: null,
    },
  };

  beforeEach(() => {
    discoveryRegistry = {
      getModules: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<DiscoveryRegistryService>;

    snapshotService = {
      getLatestByDomain: jest.fn(),
      saveSnapshot: jest.fn(),
    } as unknown as jest.Mocked<InfrastructureSnapshotService>;

    findingRuleEngine = {
      evaluate: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<FindingRuleEngineService>;

    infrastructureFindingService = {
      saveFindings: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<InfrastructureFindingService>;

    infrastructureBriefService = {
      generate: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<InfrastructureBriefService>;

    snapshotEqualityEngine = {
      isEqual: jest.fn(),
    } as unknown as jest.Mocked<SnapshotEqualityEngine>;

    verificationService = {
      create: jest.fn().mockResolvedValue({} as any),
    } as unknown as jest.Mocked<InfrastructureVerificationService>;

    engine = new UnderstandingEngine(
      discoveryRegistry,
      snapshotService,
      findingRuleEngine,
      infrastructureFindingService,
      infrastructureBriefService,
      snapshotEqualityEngine,
      verificationService,
    );
  });

  it('should process initial run when no previous snapshot exists', async () => {
    snapshotService.getLatestByDomain.mockResolvedValue(null);
    snapshotService.saveSnapshot.mockResolvedValue({
      id: 'snapshot-1',
      domainId: 'domain-1',
      jobId: 'job-1',
      responseTimeMs: 100,
      httpStatus: 200,
      payload: mockSnapshot as any,
      createdAt: new Date(),
    });

    await engine.execute('job-1', 'domain-1', 'example.com');

    expect(snapshotService.saveSnapshot).toHaveBeenCalledWith(
      'domain-1',
      'job-1',
      expect.anything(),
    );

    expect(verificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        domainId: 'domain-1',
        jobId: 'job-1',
        snapshotId: 'snapshot-1',
        snapshotCreated: true,
        changeDetected: false,
      }),
    );

    expect(findingRuleEngine.evaluate).toHaveBeenCalled();
    expect(infrastructureBriefService.generate).toHaveBeenCalledWith('snapshot-1');
  });

  it('should skip snapshot creation and analysis when newly collected snapshot is identical to latest', async () => {
    const existingSnapshot = {
      id: 'existing-snapshot-id',
      domainId: 'domain-1',
      jobId: 'old-job-id',
      responseTimeMs: 100,
      httpStatus: 200,
      payload: mockSnapshot as any,
      createdAt: new Date(),
    };

    snapshotService.getLatestByDomain.mockResolvedValue(existingSnapshot);
    snapshotEqualityEngine.isEqual.mockReturnValue(true);

    await engine.execute('job-2', 'domain-1', 'example.com');

    expect(snapshotService.saveSnapshot).not.toHaveBeenCalled();
    expect(findingRuleEngine.evaluate).not.toHaveBeenCalled();
    expect(infrastructureFindingService.saveFindings).not.toHaveBeenCalled();
    expect(infrastructureBriefService.generate).not.toHaveBeenCalled();

    expect(verificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        domainId: 'domain-1',
        jobId: 'job-2',
        snapshotId: 'existing-snapshot-id',
        snapshotCreated: false,
        changeDetected: false,
      }),
    );
  });

  it('should create new snapshot and run analysis when newly collected snapshot has changed', async () => {
    const existingSnapshot = {
      id: 'existing-snapshot-id',
      domainId: 'domain-1',
      jobId: 'old-job-id',
      responseTimeMs: 100,
      httpStatus: 200,
      payload: mockSnapshot as any,
      createdAt: new Date(),
    };

    snapshotService.getLatestByDomain.mockResolvedValue(existingSnapshot);
    snapshotEqualityEngine.isEqual.mockReturnValue(false);

    snapshotService.saveSnapshot.mockResolvedValue({
      id: 'new-snapshot-id',
      domainId: 'domain-1',
      jobId: 'job-3',
      responseTimeMs: 120,
      httpStatus: 200,
      payload: mockSnapshot as any,
      createdAt: new Date(),
    });

    await engine.execute('job-3', 'domain-1', 'example.com');

    expect(snapshotService.saveSnapshot).toHaveBeenCalledWith(
      'domain-1',
      'job-3',
      expect.anything(),
    );

    expect(verificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        domainId: 'domain-1',
        jobId: 'job-3',
        snapshotId: 'new-snapshot-id',
        snapshotCreated: true,
        changeDetected: true,
      }),
    );

    expect(findingRuleEngine.evaluate).toHaveBeenCalled();
    expect(infrastructureBriefService.generate).toHaveBeenCalledWith('new-snapshot-id');
  });
});
