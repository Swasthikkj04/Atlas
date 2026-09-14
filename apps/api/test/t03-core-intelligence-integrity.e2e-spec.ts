import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { UnderstandingEngine } from '../src/modules/understanding/understanding.engine';
import { InfrastructureSnapshotService } from '../src/modules/infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureFindingService } from '../src/modules/infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureBriefService } from '../src/modules/infrastructure-brief/services/infrastructure-brief.service';
import { ChangeDetectionEngine } from '../src/modules/understanding/services/change-detection.engine';
import { SnapshotEqualityEngine } from '../src/modules/understanding/services/snapshot-equality.engine';
import { FindingRuleEngineService } from '../src/modules/findings/services/finding-rule-engine.service';
import { DiscoverySnapshot } from '../src/infrastructure/discovery/contracts/discovery-snapshot.interface';
import { UserAccountStatus, TriggerType, ChangeType, ChangeSeverity, JobStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { UnderstandingWorker } from '../src/modules/understanding/understanding.worker';

describe('T-03: Core Intelligence Integrity E2E Certification', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let understandingEngine: UnderstandingEngine;
  let snapshotService: InfrastructureSnapshotService;
  let findingService: InfrastructureFindingService;
  let briefService: InfrastructureBriefService;
  let changeDetectionEngine: ChangeDetectionEngine;
  let snapshotEqualityEngine: SnapshotEqualityEngine;
  let findingRuleEngine: FindingRuleEngineService;

  const timestamp = Date.now();
  let userToken: string;
  let userAId: string;
  let domainAId: string;
  const domainAName = `t03-intelligence-e2e-${timestamp}.com`;

  let userBToken: string;
  let userBId: string;
  let domainBId: string;
  const domainBName = `t03-victim-${timestamp}.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    prisma = app.get(PrismaService);
    understandingEngine = app.get(UnderstandingEngine);
    snapshotService = app.get(InfrastructureSnapshotService);
    findingService = app.get(InfrastructureFindingService);
    briefService = app.get(InfrastructureBriefService);
    changeDetectionEngine = app.get(ChangeDetectionEngine);
    snapshotEqualityEngine = app.get(SnapshotEqualityEngine);
    findingRuleEngine = app.get(FindingRuleEngineService);

    await app.init();

    // Stop background worker polling to prevent race condition with manual engine executions
    try {
      const worker = app.get(UnderstandingWorker, { strict: false });
      worker?.onModuleDestroy();
    } catch {
      // ignore
    }

    // Register & Login User A
    const regResA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `t03-e2e-user-a-${timestamp}@example.com`,
        password: 'Password123!@#',
        confirmPassword: 'Password123!@#',
        fullName: 'Intelligence Lead',
      });
    userAId = regResA.body.user.id;
    await prisma.user.update({
      where: { id: userAId },
      data: { status: UserAccountStatus.ACTIVE, emailVerifiedAt: new Date() },
    });
    const loginResA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `t03-e2e-user-a-${timestamp}@example.com`,
        password: 'Password123!@#',
      });
    userToken = loginResA.body.accessToken;

    // Register & Login User B (for cross-tenant checks)
    const regResB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `t03-e2e-user-b-${timestamp}@example.com`,
        password: 'Password123!@#',
        confirmPassword: 'Password123!@#',
        fullName: 'Tenant Isolation B',
      });
    userBId = regResB.body.user.id;
    await prisma.user.update({
      where: { id: userBId },
      data: { status: UserAccountStatus.ACTIVE, emailVerifiedAt: new Date() },
    });
    const loginResB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `t03-e2e-user-b-${timestamp}@example.com`,
        password: 'Password123!@#',
      });
    userBToken = loginResB.body.accessToken;

    // Create Domain A for User A directly in DB
    const domainA = await prisma.domain.create({
      data: {
        userId: userAId,
        domainName: domainAName,
      },
    });
    domainAId = domainA.id;

    // Create Domain B for User B directly in DB
    const domainB = await prisma.domain.create({
      data: {
        userId: userBId,
        domainName: domainBName,
      },
    });
    domainBId = domainB.id;
  });

  afterAll(async () => {
    const domainIds = [domainAId, domainBId].filter(Boolean);
    if (domainIds.length > 0) {
      await prisma.infrastructureVerification.deleteMany({ where: { domainId: { in: domainIds } } });
      await prisma.changeHistory.deleteMany({ where: { domainId: { in: domainIds } } });
      await prisma.rawEvidence.deleteMany({ where: { domainId: { in: domainIds } } });
      const snapshots = await prisma.infrastructureSnapshot.findMany({ where: { domainId: { in: domainIds } } });
      const snapIds = snapshots.map((s) => s.id);
      await prisma.infrastructureFinding.deleteMany({ where: { snapshotId: { in: snapIds } } });
      await prisma.infrastructureBrief.deleteMany({ where: { snapshotId: { in: snapIds } } });
      await prisma.infrastructureSnapshot.deleteMany({ where: { domainId: { in: domainIds } } });
      await prisma.understandingJob.deleteMany({ where: { domainId: { in: domainIds } } });
      await prisma.domain.deleteMany({ where: { id: { in: domainIds } } });
    }

    const userIds = [userAId, userBId].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    await app.close();
  });

  // =========================================================================
  // 1. UNDERSTANDING PIPELINE & SNAPSHOT CREATION
  // =========================================================================
  describe('1. Understanding Pipeline & Snapshot Creation', () => {
    let createdSnapshotId: string;

    it('should execute understanding job and create authoritative snapshot', async () => {
      const jobId = randomUUID();
      await prisma.understandingJob.create({
        data: {
          id: jobId,
          domainId: domainAId,
          status: JobStatus.RUNNING,
          trigger: TriggerType.MANUAL,
        },
      });

      await understandingEngine.execute(jobId, domainAId, domainAName);

      const snapshot = await snapshotService.findByJobId(jobId);
      expect(snapshot).toBeDefined();
      expect(snapshot?.domainId).toBe(domainAId);
      createdSnapshotId = snapshot!.id;
    });

    it('GET /api/v1/domains/:id/snapshots should list the immutable snapshot with pagination', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/domains/${domainAId}/snapshots`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const found = res.body.data.find((s: any) => s.id === createdSnapshotId);
      expect(found).toBeDefined();
      expect(found).toHaveProperty('createdAt');
      expect(found).toHaveProperty('httpStatus');
    });

    it('GET /api/v1/snapshots/:id should return snapshot details without sensitive interpretations', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/snapshots/${createdSnapshotId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', createdSnapshotId);
      expect(res.body).toHaveProperty('domainId', domainAId);
      expect(res.body).toHaveProperty('payload');

      // Objective observations preserved
      const payload = res.body.payload;
      expect(payload).toBeDefined();
      // No subjective interpretations masquerading as raw facts
      expect(payload.severity).toBeUndefined();
      expect(payload.recommendations).toBeUndefined();
      expect(payload.riskConclusions).toBeUndefined();
    });
  });

  // =========================================================================
  // 2. FINDING INTEGRITY & EXPLAINABILITY ENDPOINTS
  // =========================================================================
  describe('2. Finding Integrity & Explainability Lineage', () => {
    let testFindingId: string;
    let testSnapshotId: string;

    beforeAll(async () => {
      const jobId = randomUUID();
      await prisma.understandingJob.create({
        data: { id: jobId, domainId: domainAId, status: 'PENDING', trigger: TriggerType.MANUAL },
      });

      const snapPayload: DiscoverySnapshot = {
        domainName: domainAName,
        dns: {
          txt: ['v=spf1 include:_spf.google.com ~all'],
          dmarc: [],
        },
        http: {
          reachable: true,
          protocol: 'https',
          statusCode: 200,
          headers: {
            server: 'nginx/1.22.0',
          },
        },
      };

      const snap = await snapshotService.saveSnapshot(domainAId, jobId, snapPayload);
      testSnapshotId = snap.id;

      const findings = await findingRuleEngine.evaluate({
        domainId: domainAId,
        snapshotId: snap.id,
        snapshot: snapPayload,
      });

      await findingService.saveFindings(snap.id, findings);
      await briefService.generate(snap.id);
    });

    it('GET /api/v1/findings should list findings for domain', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/findings?domainId=${domainAId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data.length).toBeGreaterThan(0);

      const hstsFinding = res.body.data.find((f: any) => f.ruleId === 'http.missing-hsts');
      expect(hstsFinding).toBeDefined();
      expect(hstsFinding.severity).toBe('HIGH');
      testFindingId = hstsFinding.id;
    });

    it('GET /api/v1/findings/:findingId should return explainability details and recommendations', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/findings/${testFindingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', testFindingId);
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('severity', 'HIGH');
      expect(res.body).toHaveProperty('recommendations');
      expect(Array.isArray(res.body.recommendations)).toBe(true);
      expect(res.body.recommendations.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/findings/:findingId/evidence should provide evidence lineage', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/findings/${testFindingId}/evidence`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('findingId', testFindingId);
      expect(res.body).toHaveProperty('observations');
    });
  });

  // =========================================================================
  // 3. INFRASTRUCTURE BRIEF INTEGRITY
  // =========================================================================
  describe('3. Infrastructure Brief Integrity', () => {
    it('GET /api/v1/snapshots/:snapshotId/brief should return faithful executive summary', async () => {
      const snapshots = await prisma.infrastructureSnapshot.findMany({ where: { domainId: domainAId } });
      expect(snapshots.length).toBeGreaterThan(0);
      const snapshotId = snapshots[0].id;

      // Ensure brief is generated
      await briefService.generate(snapshotId);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/snapshots/${snapshotId}/brief`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('overallHealth');
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('highlights');
      expect(res.body).toHaveProperty('recommendations');
      expect(Array.isArray(res.body.highlights)).toBe(true);
      expect(Array.isArray(res.body.recommendations)).toBe(true);
    });
  });

  // =========================================================================
  // 4. CHANGE DETECTION FORENSICS
  // =========================================================================
  describe('4. Change Detection Forensics API', () => {
    it('should compute and persist differences between two snapshots', async () => {
      const job1 = randomUUID();
      const job2 = randomUUID();

      await prisma.understandingJob.create({ data: { id: job1, domainId: domainAId, status: 'PENDING', trigger: TriggerType.MANUAL } });
      await prisma.understandingJob.create({ data: { id: job2, domainId: domainAId, status: 'PENDING', trigger: TriggerType.MANUAL } });

      const snap1Payload: DiscoverySnapshot = {
        domainName: domainAName,
        http: { reachable: true, statusCode: 200, headers: { server: 'nginx/1.22.0', 'strict-transport-security': 'max-age=31536000' } },
        dns: { a: ['1.1.1.1'], txt: [], aaaa: [], mx: [] },
      };

      const snap2Payload: DiscoverySnapshot = {
        domainName: domainAName,
        http: { reachable: true, statusCode: 200, headers: { server: 'nginx/1.24.0' } }, // HSTS removed, Server upgraded
        dns: { a: ['1.1.1.2'], txt: [], aaaa: [], mx: [] }, // A record changed
      };

      const snap1 = await snapshotService.saveSnapshot(domainAId, job1, snap1Payload);
      const snap2 = await snapshotService.saveSnapshot(domainAId, job2, snap2Payload);

      const count = await changeDetectionEngine.detectAndPersistChanges(
        domainAId,
        snap1.id,
        snap2.id,
        snap1Payload,
        snap2Payload,
      );

      expect(count).toBeGreaterThanOrEqual(2);

      const historyInDb = await prisma.changeHistory.findMany({
        where: { domainId: domainAId, previousSnapshotId: snap1.id, currentSnapshotId: snap2.id },
      });

      expect(historyInDb.length).toBe(count);
      const hstsRemoval = historyInDb.find((c) => c.title.includes('Strict-Transport-Security'));
      expect(hstsRemoval).toBeDefined();
      expect(hstsRemoval?.changeType).toBe(ChangeType.REMOVED);
      expect(hstsRemoval?.severity).toBe(ChangeSeverity.HIGH);
    });
  });

  // =========================================================================
  // 5. TENANT ISOLATION & SECURITY BOUNDARY
  // =========================================================================
  describe('5. Cross-Tenant Intelligence Contamination Defense', () => {
    it('should reject User A attempting to view User B snapshot brief with 404/401/403', async () => {
      const jobB = randomUUID();
      await prisma.understandingJob.create({ data: { id: jobB, domainId: domainBId, status: 'PENDING', trigger: TriggerType.MANUAL } });
      const snapB = await snapshotService.saveSnapshot(domainBId, jobB, { domainName: domainBName });
      await briefService.generate(snapB.id);

      // User A requests User B's brief
      await request(app.getHttpServer())
        .get(`/api/v1/snapshots/${snapB.id}/brief`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect((res) => {
          expect([401, 403, 404]).toContain(res.statusCode);
        });
    });

    it('should reject User A querying findings belonging to User B domain with 401/403/404/empty', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/findings?domainId=${domainBId}`)
        .set('Authorization', `Bearer ${userToken}`);

      if (res.statusCode === 200) {
        expect(res.body.data).toHaveLength(0);
      } else {
        expect([401, 403, 404]).toContain(res.statusCode);
      }
    });
  });
});
