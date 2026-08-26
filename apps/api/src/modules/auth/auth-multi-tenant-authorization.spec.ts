import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { DomainsService } from '../domains/domains.service';
import { DomainsRepository } from '../domains/repositories/domains.repository';
import { InfrastructureSnapshotService } from '../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureSnapshotRepository } from '../infrastructure-snapshots/repositories/infrastructure-snapshot.repository';
import { SnapshotController } from '../infrastructure-snapshots/controllers/snapshot.controller';
import { InfrastructureFindingService } from '../infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureFindingRepository } from '../infrastructure-findings/repositories/infrastructure-finding.repository';
import { FindingController } from '../infrastructure-findings/controllers/finding.controller';
import { InfrastructureBriefService } from '../infrastructure-brief/services/infrastructure-brief.service';
import { InfrastructureBriefRepository } from '../infrastructure-brief/repositories/infrastructure-brief.repository';
import { InfrastructureBriefBuilder } from '../infrastructure-brief/builders/infrastructure-brief.builder';
import { InfrastructureBriefController } from '../infrastructure-brief/controllers/infrastructure-brief.controller';
import { DomainReachabilityService } from '../domains/services/domain-reachability.service';
import { DomainSecurityValidator } from '../domains/services/domain-security.validator';
import { UnderstandingService } from '../understanding/understanding.service';
import { UnderstandingRepository } from '../understanding/repositories/understanding.repository';
import { UnderstandingEngine } from '../understanding/understanding.engine';

describe('REFINEMENT-002: Multi-Tenant Authorization & IDOR Isolation Test Suite', () => {
  let prisma: PrismaService;
  let snapshotController: SnapshotController;
  let findingController: FindingController;
  let briefController: InfrastructureBriefController;
  let snapshotService: InfrastructureSnapshotService;
  let findingService: InfrastructureFindingService;
  let briefService: InfrastructureBriefService;
  let understandingService: UnderstandingService;

  // Tenant fixtures
  const USER_A = {
    id: 'usr-tenant-a-uuid',
    fullName: 'Alice Enterprise',
    email: 'alice@enterprise.com',
  };
  const USER_B = {
    id: 'usr-tenant-b-uuid',
    fullName: 'Bob Competitor',
    email: 'bob@competitor.com',
  };

  const DOMAIN_A = {
    id: 'dom-a-111',
    userId: USER_A.id,
    domainName: 'alice-corp.com',
  };
  const DOMAIN_B = {
    id: 'dom-b-222',
    userId: USER_B.id,
    domainName: 'bob-inc.com',
  };

  const SNAPSHOT_A = {
    id: 'snp-a-111',
    domainId: DOMAIN_A.id,
    jobId: 'job-a-111',
    responseTimeMs: 120,
    httpStatus: 200,
    payload: { http: { statusCode: 200 }, dns: { ipAddresses: ['1.1.1.1'] } },
    createdAt: new Date(),
    domain: DOMAIN_A,
  };

  const SNAPSHOT_B = {
    id: 'snp-b-222',
    domainId: DOMAIN_B.id,
    jobId: 'job-b-222',
    responseTimeMs: 250,
    httpStatus: 200,
    payload: { http: { statusCode: 200 }, dns: { ipAddresses: ['2.2.2.2'] } },
    createdAt: new Date(),
    domain: DOMAIN_B,
  };

  const FINDING_A = {
    id: 'find-a-111',
    snapshotId: SNAPSHOT_A.id,
    ruleId: 'http.missing-hsts',
    module: 'HTTP',
    category: 'SECURITY_HEADER',
    severity: 'HIGH',
    title: 'Missing HSTS Header on Alice Corp',
    description: 'Alice Corp Strict-Transport-Security header is absent.',
    createdAt: new Date(),
    snapshot: SNAPSHOT_A,
  };

  const FINDING_B = {
    id: 'find-b-222',
    snapshotId: SNAPSHOT_B.id,
    ruleId: 'tls.weak-cipher',
    module: 'SSL',
    category: 'TLS',
    severity: 'CRITICAL',
    title: 'Weak TLS Cipher on Bob Inc',
    description: 'Bob Inc allows deprecated TLS ciphers.',
    createdAt: new Date(),
    snapshot: SNAPSHOT_B,
  };

  const BRIEF_A = {
    id: 'brf-a-111',
    snapshotId: SNAPSHOT_A.id,
    overallHealth: 'FAIR',
    summary: 'Alice Corp infrastructure summary.',
    highlights: [],
    recommendations: [],
    version: 1,
    createdAt: new Date(),
  };

  const BRIEF_B = {
    id: 'brf-b-222',
    snapshotId: SNAPSHOT_B.id,
    overallHealth: 'CRITICAL',
    summary: 'Bob Inc infrastructure summary.',
    highlights: [],
    recommendations: [],
    version: 1,
    createdAt: new Date(),
  };

  const JOB_A = {
    id: 'job-a-111',
    domainId: DOMAIN_A.id,
    status: 'COMPLETED',
    trigger: 'MANUAL',
    startedAt: new Date(),
  };

  const JOB_B = {
    id: 'job-b-222',
    domainId: DOMAIN_B.id,
    status: 'COMPLETED',
    trigger: 'MANUAL',
    startedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      domain: {
        findFirst: jest.fn(({ where }) => {
          if (where?.id === DOMAIN_A.id && where?.userId === USER_A.id)
            return Promise.resolve(DOMAIN_A);
          if (where?.id === DOMAIN_B.id && where?.userId === USER_B.id)
            return Promise.resolve(DOMAIN_B);
          return Promise.resolve(null);
        }),
        findMany: jest.fn(({ where }) => {
          if (where?.userId === USER_A.id) return Promise.resolve([DOMAIN_A]);
          if (where?.userId === USER_B.id) return Promise.resolve([DOMAIN_B]);
          return Promise.resolve([]);
        }),
      },
      infrastructureSnapshot: {
        findFirst: jest.fn(({ where }) => {
          if (
            where?.id === SNAPSHOT_A.id &&
            where?.domain?.userId === USER_A.id
          )
            return Promise.resolve(SNAPSHOT_A);
          if (
            where?.id === SNAPSHOT_B.id &&
            where?.domain?.userId === USER_B.id
          )
            return Promise.resolve(SNAPSHOT_B);
          return Promise.resolve(null);
        }),
        findMany: jest.fn(({ where }) => {
          if (
            where?.domainId === DOMAIN_A.id &&
            where?.domain?.userId === USER_A.id
          )
            return Promise.resolve([SNAPSHOT_A]);
          if (
            where?.domainId === DOMAIN_B.id &&
            where?.domain?.userId === USER_B.id
          )
            return Promise.resolve([SNAPSHOT_B]);
          return Promise.resolve([]);
        }),
        count: jest.fn(({ where }) => {
          if (
            where?.domainId === DOMAIN_A.id &&
            where?.domain?.userId === USER_A.id
          )
            return Promise.resolve(1);
          if (
            where?.domainId === DOMAIN_B.id &&
            where?.domain?.userId === USER_B.id
          )
            return Promise.resolve(1);
          return Promise.resolve(0);
        }),
      },
      infrastructureFinding: {
        findFirst: jest.fn(({ where }) => {
          if (
            (where?.OR?.[0]?.id === FINDING_A.id ||
              where?.id === FINDING_A.id) &&
            where?.snapshot?.domain?.userId === USER_A.id
          ) {
            return Promise.resolve(FINDING_A);
          }
          if (
            (where?.OR?.[0]?.id === FINDING_B.id ||
              where?.id === FINDING_B.id) &&
            where?.snapshot?.domain?.userId === USER_B.id
          ) {
            return Promise.resolve(FINDING_B);
          }
          return Promise.resolve(null);
        }),
        findMany: jest.fn(({ where }) => {
          if (
            where?.snapshotId === SNAPSHOT_A.id &&
            where?.snapshot?.domain?.userId === USER_A.id
          )
            return Promise.resolve([FINDING_A]);
          if (
            where?.snapshotId === SNAPSHOT_B.id &&
            where?.snapshot?.domain?.userId === USER_B.id
          )
            return Promise.resolve([FINDING_B]);
          return Promise.resolve([]);
        }),
        count: jest.fn(({ where }) => {
          if (
            where?.snapshotId === SNAPSHOT_A.id &&
            where?.snapshot?.domain?.userId === USER_A.id
          )
            return Promise.resolve(1);
          if (
            where?.snapshotId === SNAPSHOT_B.id &&
            where?.snapshot?.domain?.userId === USER_B.id
          )
            return Promise.resolve(1);
          return Promise.resolve(0);
        }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      infrastructureBrief: {
        findFirst: jest.fn(({ where }) => {
          if (
            where?.snapshotId === SNAPSHOT_A.id &&
            where?.snapshot?.domain?.userId === USER_A.id
          )
            return Promise.resolve(BRIEF_A);
          if (
            where?.snapshotId === SNAPSHOT_B.id &&
            where?.snapshot?.domain?.userId === USER_B.id
          )
            return Promise.resolve(BRIEF_B);
          return Promise.resolve(null);
        }),
        create: jest.fn().mockResolvedValue(BRIEF_A),
        update: jest.fn().mockResolvedValue(BRIEF_A),
      },
      understandingJob: {
        findFirst: jest.fn(({ where }) => {
          if (where?.id === JOB_A.id && where?.domain?.userId === USER_A.id)
            return Promise.resolve(JOB_A);
          if (where?.id === JOB_B.id && where?.domain?.userId === USER_B.id)
            return Promise.resolve(JOB_B);
          return Promise.resolve(null);
        }),
        findMany: jest.fn(({ where }) => {
          if (
            where?.domainId === DOMAIN_A.id &&
            where?.domain?.userId === USER_A.id
          )
            return Promise.resolve([JOB_A]);
          if (
            where?.domainId === DOMAIN_B.id &&
            where?.domain?.userId === USER_B.id
          )
            return Promise.resolve([JOB_B]);
          return Promise.resolve([]);
        }),
        create: jest.fn().mockResolvedValue({
          id: 'job-new-123',
          domainId: DOMAIN_A.id,
          status: 'PENDING',
        }),
      },
      rawEvidence: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      changeHistory: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        DomainsRepository,
        DomainsService,
        DomainReachabilityService,
        DomainSecurityValidator,
        InfrastructureSnapshotRepository,
        InfrastructureSnapshotService,
        SnapshotController,
        InfrastructureFindingRepository,
        InfrastructureFindingService,
        FindingController,
        InfrastructureBriefRepository,
        InfrastructureBriefBuilder,
        InfrastructureBriefService,
        InfrastructureBriefController,
        UnderstandingRepository,
        { provide: UnderstandingEngine, useValue: {} },
        UnderstandingService,
      ],
    }).compile();

    prisma = module.get(PrismaService);
    snapshotController = module.get(SnapshotController);
    findingController = module.get(FindingController);
    briefController = module.get(InfrastructureBriefController);
    snapshotService = module.get(InfrastructureSnapshotService);
    findingService = module.get(InfrastructureFindingService);
    briefService = module.get(InfrastructureBriefService);
    understandingService = module.get(UnderstandingService);
  });

  describe('1. Snapshot Authorization & IDOR Protection', () => {
    it('USER_A can read their own snapshot (Snapshot A)', async () => {
      const req = { user: USER_A } as any;
      const result = await snapshotController.getSnapshotById(
        req,
        SNAPSHOT_A.id,
      );

      expect(result.id).toBe(SNAPSHOT_A.id);
      expect(result.domainId).toBe(DOMAIN_A.id);
    });

    it('USER_A CANNOT read USER_B snapshot (Snapshot B) -> Throws 404 NotFoundException', async () => {
      const req = { user: USER_A } as any;

      await expect(
        snapshotController.getSnapshotById(req, SNAPSHOT_B.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('USER_A CANNOT list snapshots for USER_B domain (Domain B) -> Returns empty list', async () => {
      const req = { user: USER_A } as any;
      const result = await snapshotController.getSnapshotsByDomain(
        req,
        DOMAIN_B.id,
        1,
        20,
      );

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('2. Finding Authorization & IDOR Protection', () => {
    it('USER_A can read findings for their own snapshot (Snapshot A)', async () => {
      const req = { user: USER_A } as any;
      const result = await findingController.getFindingsBySnapshot(
        req,
        SNAPSHOT_A.id,
        1,
        20,
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(FINDING_A.id);
      expect(result.data[0].title).toBe(FINDING_A.title);
    });

    it('USER_A CANNOT read findings for USER_B snapshot (Snapshot B) -> Throws 404 NotFoundException', async () => {
      const req = { user: USER_A } as any;

      await expect(
        findingController.getFindingsBySnapshot(req, SNAPSHOT_B.id, 1, 20),
      ).rejects.toThrow(NotFoundException);
    });

    it('USER_A CANNOT read USER_B finding directly (Finding B) -> Throws 404 NotFoundException', async () => {
      const req = { user: USER_A } as any;

      await expect(
        findingController.getFindingDetail(req, FINDING_B.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. Infrastructure Brief Authorization & Side-Effect Protection', () => {
    it('USER_A can read their own snapshot brief (Brief A)', async () => {
      const req = { user: USER_A } as any;
      const result = await briefController.getBySnapshot(req, SNAPSHOT_A.id);

      expect(result.id).toBe(BRIEF_A.id);
      expect(result.summary).toBe(BRIEF_A.summary);
    });

    it('USER_A CANNOT read USER_B snapshot brief (Brief B) -> Throws 404 NotFoundException', async () => {
      const req = { user: USER_A } as any;

      await expect(
        briefController.getBySnapshot(req, SNAPSHOT_B.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('USER_A CANNOT generate a brief for USER_B snapshot (Snapshot B) -> Zero side effects & Throws 404', async () => {
      const req = { user: USER_A } as any;
      const mockRes = { setHeader: jest.fn() } as any;

      await expect(
        briefController.generate(req, SNAPSHOT_B.id, mockRes),
      ).rejects.toThrow(NotFoundException);

      // Verify zero writes / zero brief creations occurred
      expect(prisma.infrastructureBrief.create).not.toHaveBeenCalled();
    });
  });

  describe('4. Understanding Job Authorization & Side-Effect Protection', () => {
    it('USER_A can inspect their own job status (Job A)', async () => {
      const result = await understandingService.findById(USER_A.id, JOB_A.id);
      expect(result.id).toBe(JOB_A.id);
      expect(result.domainId).toBe(DOMAIN_A.id);
    });

    it('USER_A CANNOT inspect USER_B job status (Job B) -> Throws 404 NotFoundException', async () => {
      await expect(
        understandingService.findById(USER_A.id, JOB_B.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('USER_A CANNOT list jobs for USER_B domain (Domain B) -> Throws 404 NotFoundException', async () => {
      await expect(
        understandingService.findByDomain(USER_A.id, DOMAIN_B.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('USER_A CANNOT trigger understanding job for USER_B domain (Domain B) -> Zero jobs queued & Throws 404', async () => {
      await expect(
        understandingService.create(USER_A.id, DOMAIN_B.id),
      ).rejects.toThrow(NotFoundException);

      // Verify zero jobs created
      expect(prisma.understandingJob.create).not.toHaveBeenCalled();
    });
  });

  describe('5. Symmetric Cross-Tenant Verification (USER_B -> USER_A)', () => {
    it('USER_B CANNOT read Snapshot A', async () => {
      const req = { user: USER_B } as any;
      await expect(
        snapshotController.getSnapshotById(req, SNAPSHOT_A.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('USER_B CANNOT read Findings for Snapshot A', async () => {
      const req = { user: USER_B } as any;
      await expect(
        findingController.getFindingsBySnapshot(req, SNAPSHOT_A.id, 1, 20),
      ).rejects.toThrow(NotFoundException);
    });

    it('USER_B CANNOT read Brief A or trigger brief generation for Snapshot A', async () => {
      const req = { user: USER_B } as any;
      const mockRes = { setHeader: jest.fn() } as any;

      await expect(
        briefController.getBySnapshot(req, SNAPSHOT_A.id),
      ).rejects.toThrow(NotFoundException);

      await expect(
        briefController.generate(req, SNAPSHOT_A.id, mockRes),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
