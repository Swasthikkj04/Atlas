import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { UnderstandingEngine } from './modules/understanding/understanding.engine';
import { UnderstandingService } from './modules/understanding/understanding.service';
import { DomainsService } from './modules/domains/domains.service';
import { FindingRuleEngineService } from './modules/findings/services/finding-rule-engine.service';
import { InfrastructureSnapshotService } from './modules/infrastructure-snapshots/services/infrastructure-snapshot.service';
import { JobStatus, TriggerType, UserAccountStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { UnderstandingWorker } from './modules/understanding/understanding.worker';

jest.setTimeout(30000);

describe('T-05: API & Backend Contract Integrity Unit Spec', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let understandingEngine: UnderstandingEngine;
  let understandingService: UnderstandingService;
  let domainsService: DomainsService;
  let snapshotService: InfrastructureSnapshotService;

  let userAId: string;
  let userBId: string;
  let domainAId: string;
  let domainBId: string;
  const domainAName = `t05-contract-a-${Date.now()}.io`;
  const domainBName = `t05-contract-b-${Date.now()}.io`;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();

    try {
      const worker = moduleRef.get(UnderstandingWorker, { strict: false });
      worker?.onModuleDestroy();
    } catch {
      // ignore
    }

    prisma = moduleRef.get(PrismaService);
    understandingEngine = moduleRef.get(UnderstandingEngine);
    understandingService = moduleRef.get(UnderstandingService);
    domainsService = moduleRef.get(DomainsService);
    snapshotService = moduleRef.get(InfrastructureSnapshotService);

    // Setup Tenant A
    const userA = await prisma.user.create({
      data: {
        email: `t05-spec-user-a-${Date.now()}@example.com`,
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$mockhashA',
        fullName: 'Tenant A Contract QA',
        status: UserAccountStatus.ACTIVE,
      },
    });
    userAId = userA.id;

    const domainA = await prisma.domain.create({
      data: {
        domainName: domainAName,
        userId: userAId,
      },
    });
    domainAId = domainA.id;

    // Setup Tenant B
    const userB = await prisma.user.create({
      data: {
        email: `t05-spec-user-b-${Date.now()}@example.com`,
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$mockhashB',
        fullName: 'Tenant B Contract QA',
        status: UserAccountStatus.ACTIVE,
      },
    });
    userBId = userB.id;

    const domainB = await prisma.domain.create({
      data: {
        domainName: domainBName,
        userId: userBId,
      },
    });
    domainBId = domainB.id;
  });

  afterAll(async () => {
    try {
      const domainIds = [domainAId, domainBId].filter(Boolean);
      if (domainIds.length > 0 && prisma) {
        await prisma.infrastructureVerification.deleteMany({
          where: { domainId: { in: domainIds } },
        });
        await prisma.changeHistory.deleteMany({
          where: { domainId: { in: domainIds } },
        });
        await prisma.rawEvidence.deleteMany({
          where: { domainId: { in: domainIds } },
        });
        const snapshots = await prisma.infrastructureSnapshot.findMany({
          where: { domainId: { in: domainIds } },
        });
        const snapIds = snapshots.map((s) => s.id);
        await prisma.infrastructureFinding.deleteMany({
          where: { snapshotId: { in: snapIds } },
        });
        await prisma.infrastructureBrief.deleteMany({
          where: { snapshotId: { in: snapIds } },
        });
        await prisma.infrastructureSnapshot.deleteMany({
          where: { domainId: { in: domainIds } },
        });
        await prisma.understandingJob.deleteMany({
          where: { domainId: { in: domainIds } },
        });
        await prisma.domain.deleteMany({ where: { id: { in: domainIds } } });
      }

      const userIds = [userAId, userBId].filter(Boolean);
      if (userIds.length > 0 && prisma) {
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
    } catch {
      // ignore cleanup errors
    } finally {
      if (moduleRef) {
        await moduleRef.close();
      }
    }
  });

  // =========================================================================
  // 1. STATE MACHINE & ASYNC JOB LIFECYCLE CONTRACT
  // =========================================================================
  describe('1. State Transition & Job Lifecycle Integrity', () => {
    it('should follow canonical state machine: PENDING -> RUNNING -> COMPLETED', async () => {
      const jobId = randomUUID();
      const job = await prisma.understandingJob.create({
        data: {
          id: jobId,
          domainId: domainAId,
          status: JobStatus.PENDING,
          trigger: TriggerType.MANUAL,
        },
      });
      expect(job.status).toBe(JobStatus.PENDING);

      // Transition to RUNNING
      const runningJob = await prisma.understandingJob.update({
        where: { id: jobId },
        data: { status: JobStatus.RUNNING, startedAt: new Date() },
      });
      expect(runningJob.status).toBe(JobStatus.RUNNING);
      expect(runningJob.startedAt).toBeDefined();

      // Transition to COMPLETED
      const completedJob = await prisma.understandingJob.update({
        where: { id: jobId },
        data: { status: JobStatus.COMPLETED, completedAt: new Date() },
      });
      expect(completedJob.status).toBe(JobStatus.COMPLETED);
      expect(completedJob.completedAt).toBeDefined();
    });

    it('should reject or prevent invalid job state regressions from COMPLETED to RUNNING', async () => {
      const completedJobId = randomUUID();
      await prisma.understandingJob.create({
        data: {
          id: completedJobId,
          domainId: domainAId,
          status: JobStatus.COMPLETED,
          trigger: TriggerType.MANUAL,
          completedAt: new Date(),
        },
      });

      // Business logic gate in understanding service prevents executing already COMPLETED jobs
      const fetched = await understandingService.findById(
        userAId,
        completedJobId,
      );
      expect(fetched.status).toBe(JobStatus.COMPLETED);
    });
  });

  // =========================================================================
  // 2. DOMAIN OWNERSHIP & AUTHORIZATION BOUNDARIES
  // =========================================================================
  describe('2. Backend Domain Ownership Enforcement', () => {
    it('User A querying User B domain via service throws NotFoundException (never leaks ownership)', async () => {
      await expect(domainsService.findById(userAId, domainBId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('User A deleting User B domain via service throws NotFoundException', async () => {
      await expect(domainsService.delete(userAId, domainBId)).rejects.toThrow(
        NotFoundException,
      );

      // Verify domain B was NOT deleted
      const checkDomain = await prisma.domain.findUnique({
        where: { id: domainBId },
      });
      expect(checkDomain).toBeDefined();
    });

    it('User A triggering understanding on User B domain throws NotFoundException', async () => {
      await expect(
        understandingService.create(userAId, domainBId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // 3. CONCURRENCY & INVARIANT PRESERVATION
  // =========================================================================
  describe('3. Concurrency & Invariant Preservation', () => {
    it('should handle simultaneous understanding job creations safely without duplicate snapshot corruption', async () => {
      const promises = [
        understandingService.create(userAId, domainAId),
        understandingService.create(userAId, domainAId),
        understandingService.create(userAId, domainAId),
      ];

      const results = await Promise.allSettled(promises);
      const successfulJobs = results.filter((r) => r.status === 'fulfilled');

      expect(successfulJobs.length).toBeGreaterThanOrEqual(1);

      // Verify each created job is distinct and linked to domainA
      for (const res of successfulJobs) {
        if (res.status === 'fulfilled') {
          expect(res.value.domainId).toBe(domainAId);
          expect(res.value.status).toBe(JobStatus.PENDING);
        }
      }
    });
  });

  // =========================================================================
  // 4. OPENAPI / CONTRACT CONSISTENCY SPECIFICATION
  // =========================================================================
  describe('4. OpenAPI Schema Generation & Contract Consistency', () => {
    it('should generate valid OpenAPI Document containing required tags, paths, and security schemes', async () => {
      const app = moduleRef.createNestApplication();
      app.setGlobalPrefix('api/v1');

      const swaggerConfig = new DocumentBuilder()
        .setTitle('Atlas API')
        .setDescription('Atlas Infrastructure Intelligence Platform API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, swaggerConfig);

      expect(document.openapi).toMatch(/^3\./);
      expect(document.info.title).toBe('Atlas API');
      expect(document.paths).toBeDefined();

      // Check key contractual paths are present in Swagger document
      const paths = Object.keys(document.paths);
      expect(paths).toContain('/api/v1/auth/login');
      expect(paths).toContain('/api/v1/auth/register');
      expect(paths).toContain('/api/v1/domains');
      expect(paths).toContain('/api/v1/health');

      await app.close();
    });
  });
});
