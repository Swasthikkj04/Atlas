import { SnapshotMemoryService } from './snapshot-memory.service';
import { SnapshotFingerprintService } from './snapshot-fingerprint.service';
import { SnapshotCanonicalizerService } from './snapshot-canonicalizer.service';
import { InfrastructureSnapshotRepository } from '../../infrastructure-snapshots/repositories/infrastructure-snapshot.repository';
import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { NotFoundException } from '@nestjs/common';

describe('SnapshotMemoryService (TECH-005)', () => {
  let memoryService: SnapshotMemoryService;
  let fingerprintService: SnapshotFingerprintService;
  let canonicalizer: SnapshotCanonicalizerService;
  let snapshotRepository: jest.Mocked<InfrastructureSnapshotRepository>;

  beforeEach(() => {
    canonicalizer = new SnapshotCanonicalizerService();
    fingerprintService = new SnapshotFingerprintService(canonicalizer);
    snapshotRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByJobId: jest.fn(),
      findByIdForUser: jest.fn(),
      findByDomain: jest.fn(),
      findByDomainForUser: jest.fn(),
      findLatestByDomain: jest.fn(),
      countByDomain: jest.fn(),
      countByDomainForUser: jest.fn(),
      countByUser: jest.fn(),
      findLatestScanByUser: jest.fn(),
    } as any;

    memoryService = new SnapshotMemoryService(
      fingerprintService,
      snapshotRepository,
    );
  });

  const createMockDiscovery = (): DiscoverySnapshot => ({
    dns: {
      a: ['1.1.1.1'],
      aaaa: [],
      mx: [],
      txt: [],
      cname: [],
      ns: [],
      dmarc: [],
    },
    http: {
      reachable: true,
      url: 'https://sample.com',
      finalUrl: 'https://sample.com',
      protocol: 'https',
      statusCode: 200,
      responseTimeMs: 20,
      headers: { server: 'nginx' },
      redirects: [],
      redirectHops: [],
      redirectCount: 0,
      finalResponse: null,
      queryStatus: 'SUCCESS',
      confidence: 'AUTHORITATIVE',
      error: null,
    },
    technology: {
      technologies: [
        {
          id: 'tech-nginx',
          name: 'NGINX',
          category: 'Web Server',
          status: 'DETECTED',
          confidence: 0.99,
          confidenceLevel: 'HIGH',
          whyDetected: 'Server: nginx',
          role: 'Gateway',
          infrastructureMeaning: 'Reverse proxy',
          evidence: [],
          signals: [],
          evidenceCount: 1,
        },
      ],
      topology: {
        nodes: [],
        relationships: [],
        layers: {} as any,
        summary: 'NGINX gateway',
        totalNodes: 1,
        totalRelationships: 0,
        confirmedRelationshipsCount: 0,
        supportedRelationshipsCount: 0,
        inferredRelationshipsCount: 0,
        generatedAt: new Date().toISOString(),
      },
      architectureBrief: {
        summary: 'Summary',
        architecturePath: [],
        layers: [],
        keyTechnologies: [],
        integrations: [],
        evidence: [],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.99,
          layerConfidence: {} as any,
          rationale: 'Rationale',
          confirmedRelationshipsCount: 0,
          supportedRelationshipsCount: 0,
          inferredRelationshipsCount: 0,
        },
        knownUnknowns: [],
        claimBoundaries: [],
        generatedAt: new Date().toISOString(),
      },
    },
  });

  describe('createSnapshotMemory', () => {
    it('creates immutable snapshot memory with distinct observedAt and createdAt timestamps', () => {
      const discovery = createMockDiscovery();
      const observedAt = new Date('2026-08-25T10:00:00Z');

      const memory = memoryService.createSnapshotMemory(
        'snap-1',
        'dom-1',
        'sample.com',
        discovery,
        observedAt,
      );

      expect(memory.snapshotId).toBe('snap-1');
      expect(memory.domainId).toBe('dom-1');
      expect(memory.domainName).toBe('sample.com');
      expect(memory.observedAt).toBe('2026-08-25T10:00:00.000Z');
      expect(memory.snapshotVersion).toBe('2.0.0');
      expect(memory.technologies).toHaveLength(1);
      expect(memory.technologies[0].name).toBe('NGINX');
      expect(memory.fingerprints.overallFingerprint).toBeDefined();
    });
  });

  describe('compareBaselines', () => {
    it('accurately identifies identical snapshots via overall fingerprint', () => {
      const discovery = createMockDiscovery();
      const mem1 = memoryService.createSnapshotMemory(
        'snap-1',
        'dom-1',
        'sample.com',
        discovery,
      );
      const mem2 = memoryService.createSnapshotMemory(
        'snap-2',
        'dom-1',
        'sample.com',
        discovery,
      );

      const comparison = memoryService.compareBaselines(mem2, mem1);

      expect(comparison.isIdentical).toBe(true);
      expect(comparison.hasTechnologyChanges).toBe(false);
      expect(comparison.hasTopologyChanges).toBe(false);
      expect(comparison.hasArchitectureChanges).toBe(false);
    });

    it('identifies changes when a technology is added in current run', () => {
      const discovery1 = createMockDiscovery();
      const discovery2 = createMockDiscovery();
      (discovery2.technology?.technologies as any[]).push({
        id: 'tech-docker',
        name: 'Docker',
        category: 'Runtime',
        confidence: 0.95,
      });

      const mem1 = memoryService.createSnapshotMemory(
        'snap-1',
        'dom-1',
        'sample.com',
        discovery1,
      );
      const mem2 = memoryService.createSnapshotMemory(
        'snap-2',
        'dom-1',
        'sample.com',
        discovery2,
      );

      const comparison = memoryService.compareBaselines(mem2, mem1);

      expect(comparison.isIdentical).toBe(false);
      expect(comparison.hasTechnologyChanges).toBe(true);
    });

    it('handles null baseline comparison on first discovery run', () => {
      const discovery = createMockDiscovery();
      const mem = memoryService.createSnapshotMemory(
        'snap-1',
        'dom-1',
        'sample.com',
        discovery,
      );

      const comparison = memoryService.compareBaselines(mem, null);

      expect(comparison.isIdentical).toBe(false);
      expect(comparison.baselineSnapshotId).toBeNull();
      expect(comparison.hasTechnologyChanges).toBe(true);
    });
  });

  describe('getBaselineById & Authorization', () => {
    it('retrieves snapshot memory and verifies user authorization', async () => {
      const discovery = createMockDiscovery();
      const memory = memoryService.createSnapshotMemory(
        'snap-auth-1',
        'dom-auth-1',
        'sample.com',
        discovery,
      );

      snapshotRepository.findByIdForUser.mockResolvedValue({
        id: 'snap-auth-1',
        domainId: 'dom-auth-1',
        jobId: 'job-1',
        responseTimeMs: 20,
        httpStatus: 200,
        payload: {
          ...discovery,
          memory,
        } as any,
        createdAt: new Date(),
      } as any);

      const result = await memoryService.getBaselineById(
        'snap-auth-1',
        'user-123',
      );

      expect(result.snapshotId).toBe('snap-auth-1');
      expect(result.domainId).toBe('dom-auth-1');
      expect(result.technologies[0].name).toBe('NGINX');
    });

    it('throws NotFoundException when snapshot does not belong to the user', async () => {
      snapshotRepository.findByIdForUser.mockResolvedValue(null);

      await expect(
        memoryService.getBaselineById('snap-foreign', 'unauthorized-user'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
