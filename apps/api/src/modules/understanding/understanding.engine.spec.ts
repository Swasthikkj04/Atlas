import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { DiscoveryRegistryService } from '../../infrastructure/discovery/registry/discovery-registry.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureBriefService } from '../infrastructure-brief/services/infrastructure-brief.service';
import { InfrastructureFindingService } from '../infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureSnapshotService } from '../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureVerificationService } from './services/infrastructure-verification.service';
import { SnapshotEqualityEngine } from './services/snapshot-equality.engine';
import { ChangeDetectionEngine } from './services/change-detection.engine';
import { UnderstandingEngine } from './understanding.engine';

describe('UnderstandingEngine', () => {
  let engine: UnderstandingEngine;
  let discoveryRegistry: jest.Mocked<DiscoveryRegistryService>;
  let snapshotService: jest.Mocked<InfrastructureSnapshotService>;
  let findingRuleEngine: jest.Mocked<FindingRuleEngineService>;
  let infrastructureFindingService: jest.Mocked<InfrastructureFindingService>;
  let infrastructureBriefService: jest.Mocked<InfrastructureBriefService>;
  let snapshotEqualityEngine: jest.Mocked<SnapshotEqualityEngine>;
  let changeDetectionEngine: jest.Mocked<ChangeDetectionEngine>;
  let verificationService: jest.Mocked<InfrastructureVerificationService>;
  let understandingRepository: jest.Mocked<any>;

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
      findByJobId: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<InfrastructureSnapshotService>;

    findingRuleEngine = {
      evaluate: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<FindingRuleEngineService>;

    infrastructureFindingService = {
      saveFindings: jest.fn().mockResolvedValue(undefined),
      getFindingsBySnapshotInternal: jest
        .fn()
        .mockResolvedValue({ data: [], pagination: {} } as any),
    } as unknown as jest.Mocked<InfrastructureFindingService>;

    infrastructureBriefService = {
      generate: jest.fn().mockResolvedValue(undefined),
      getBySnapshot: jest.fn().mockResolvedValue({} as any),
    } as unknown as jest.Mocked<InfrastructureBriefService>;

    snapshotEqualityEngine = {
      isEqual: jest.fn(),
    } as unknown as jest.Mocked<SnapshotEqualityEngine>;

    changeDetectionEngine = {
      detectAndPersistChanges: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<ChangeDetectionEngine>;

    verificationService = {
      create: jest.fn().mockResolvedValue({} as any),
    } as unknown as jest.Mocked<InfrastructureVerificationService>;

    understandingRepository = {
      linkJobToSnapshot: jest.fn().mockResolvedValue(undefined),
    };

    const providerAttributionService = {
      attributeInfrastructure: jest.fn().mockReturnValue({
        hosting: { provider: null, decision: 'UNKNOWN', confidence: 'LOW' },
        edgeCdn: { provider: null, decision: 'UNKNOWN', confidence: 'LOW' },
        dns: { provider: null, decision: 'UNKNOWN', confidence: 'LOW' },
        webServer: { provider: 'nginx', decision: 'CONFIRMED', confidence: 'HIGH' },
        application: { provider: null, decision: 'UNKNOWN', confidence: 'LOW' },
      }),
    };

    engine = new UnderstandingEngine(
      discoveryRegistry,
      snapshotService,
      findingRuleEngine,
      infrastructureFindingService,
      infrastructureBriefService,
      snapshotEqualityEngine,
      changeDetectionEngine,
      verificationService,
      understandingRepository,
      providerAttributionService as any,
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
    expect(infrastructureBriefService.generate).toHaveBeenCalledWith(
      'snapshot-1',
    );
  });

  it('should resume idempotently without creating duplicate snapshot if snapshot already exists for jobId', async () => {
    const existingJobSnapshot = {
      id: 'snapshot-pre-existing',
      domainId: 'domain-1',
      jobId: 'job-crashed-1',
      responseTimeMs: 100,
      httpStatus: 200,
      payload: mockSnapshot as any,
      createdAt: new Date(),
    };

    snapshotService.findByJobId.mockResolvedValue(existingJobSnapshot as any);
    infrastructureFindingService.getFindingsBySnapshotInternal.mockResolvedValue(
      {
        data: [{ id: 'finding-1' } as any],
        pagination: {} as any,
      },
    );

    await engine.execute('job-crashed-1', 'domain-1', 'example.com');

    expect(snapshotService.saveSnapshot).not.toHaveBeenCalled();
    expect(verificationService.create).not.toHaveBeenCalled();
  });

  it('should persist snapshot and record changeDetected: false when newly collected snapshot is identical to latest', async () => {
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

    snapshotService.saveSnapshot.mockResolvedValue({
      id: 'snapshot-2',
      domainId: 'domain-1',
      jobId: 'job-2',
      responseTimeMs: 100,
      httpStatus: 200,
      payload: mockSnapshot as any,
      createdAt: new Date(),
    });

    await engine.execute('job-2', 'domain-1', 'example.com');

    expect(snapshotService.saveSnapshot).toHaveBeenCalledWith(
      'domain-1',
      'job-2',
      expect.anything(),
    );
    expect(findingRuleEngine.evaluate).toHaveBeenCalled();
    expect(infrastructureFindingService.saveFindings).toHaveBeenCalled();
    expect(infrastructureBriefService.generate).toHaveBeenCalled();

    expect(verificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        domainId: 'domain-1',
        jobId: 'job-2',
        snapshotId: 'snapshot-2',
        snapshotCreated: true,
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
    expect(changeDetectionEngine.detectAndPersistChanges).toHaveBeenCalledWith(
      'domain-1',
      'existing-snapshot-id',
      'new-snapshot-id',
      mockSnapshot,
      expect.anything(),
    );
    expect(infrastructureBriefService.generate).toHaveBeenCalledWith(
      'new-snapshot-id',
    );
  });
});
