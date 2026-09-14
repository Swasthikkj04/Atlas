import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { EvidenceService } from '../src/infrastructure/evidence/services/evidence.service';
import { InfrastructureSnapshotService } from '../src/modules/infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureFindingService } from '../src/modules/infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureBriefService } from '../src/modules/infrastructure-brief/services/infrastructure-brief.service';
import { FindingRuleEngineService } from '../src/modules/findings/services/finding-rule-engine.service';
import { DiscoverySnapshot } from '../src/infrastructure/discovery/contracts/discovery-snapshot.interface';
import { EvidenceCategory, FindingCategory, FindingModule, Severity, UserAccountStatus, TriggerType } from '@prisma/client';
import { randomUUID } from 'crypto';

describe('T-04: Evidence & Data Integrity E2E Certification', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let evidenceService: EvidenceService;
  let snapshotService: InfrastructureSnapshotService;
  let findingService: InfrastructureFindingService;
  let briefService: InfrastructureBriefService;
  let findingRuleEngine: FindingRuleEngineService;

  const timestamp = Date.now();
  let userTokenA: string;
  let userAId: string;
  let domainAId: string;
  const domainAName = `t04-tenant-a-${timestamp}.com`;

  let userTokenB: string;
  let userBId: string;
  let domainBId: string;
  const domainBName = `t04-tenant-b-${timestamp}.com`;

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
    evidenceService = app.get(EvidenceService);
    snapshotService = app.get(InfrastructureSnapshotService);
    findingService = app.get(InfrastructureFindingService);
    briefService = app.get(InfrastructureBriefService);
    findingRuleEngine = app.get(FindingRuleEngineService);

    await app.init();

    // Register & Login User A
    const regResA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `t04-e2e-user-a-${timestamp}@example.com`,
        password: 'Password123!@#',
        confirmPassword: 'Password123!@#',
        fullName: 'Tenant A Admin',
      });
    userAId = regResA.body.user.id;
    await prisma.user.update({
      where: { id: userAId },
      data: { status: UserAccountStatus.ACTIVE, emailVerifiedAt: new Date() },
    });
    const loginResA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `t04-e2e-user-a-${timestamp}@example.com`,
        password: 'Password123!@#',
      });
    userTokenA = loginResA.body.accessToken;

    // Register & Login User B
    const regResB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `t04-e2e-user-b-${timestamp}@example.com`,
        password: 'Password123!@#',
        confirmPassword: 'Password123!@#',
        fullName: 'Tenant B Admin',
      });
    userBId = regResB.body.user.id;
    await prisma.user.update({
      where: { id: userBId },
      data: { status: UserAccountStatus.ACTIVE, emailVerifiedAt: new Date() },
    });
    const loginResB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `t04-e2e-user-b-${timestamp}@example.com`,
        password: 'Password123!@#',
      });
    userTokenB = loginResB.body.accessToken;

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
  // 1. DATA PERSISTENCE & LINEAGE ACROSS API
  // =========================================================================
  describe('1. Evidence Lineage Across Public API Endpoints', () => {
    let testSnapshotId: string;
    let testFindingId: string;

    beforeAll(async () => {
      const jobId = randomUUID();
      await prisma.understandingJob.create({
        data: { id: jobId, domainId: domainAId, status: 'PENDING', trigger: TriggerType.MANUAL },
      });

      const snapPayload: DiscoverySnapshot = {
        domainName: domainAName,
        http: {
          reachable: true,
          protocol: 'https',
          statusCode: 200,
          headers: { server: 'nginx/1.22.0' }, // Missing HSTS
        },
      };

      const snap = await snapshotService.saveSnapshot(domainAId, jobId, snapPayload);
      testSnapshotId = snap.id;

      // Save raw evidence
      await evidenceService.saveEvidence({
        domainId: domainAId,
        snapshotId: snap.id,
        collectorName: 'http-collector',
        collectorVersion: '1.0.0',
        category: EvidenceCategory.HTTP_RESPONSE,
        payloadType: 'http-headers',
        target: `https://${domainAName}`,
        payload: snapPayload.http,
      });

      const findings = await findingRuleEngine.evaluate({
        domainId: domainAId,
        snapshotId: snap.id,
        snapshot: snapPayload,
      });

      await findingService.saveFindings(snap.id, findings);
      await briefService.generate(snap.id);

      const dbFinding = await prisma.infrastructureFinding.findFirst({
        where: { snapshotId: snap.id, ruleId: 'http.missing-hsts' },
      });
      testFindingId = dbFinding!.id;
    });

    it('GET /api/v1/findings/:id should expose verified evidence lineage', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/findings/${testFindingId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(200);

      expect(res.body.id).toBe(testFindingId);
      expect(res.body.snapshotId).toBe(testSnapshotId);
      expect(res.body.rule).toBeDefined();
      expect(res.body.rule.ruleId).toBe('http.missing-hsts');
      expect(Array.isArray(res.body.evidence)).toBe(true);
      expect(res.body.evidence.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/findings/:id/evidence should return verified observation payload', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/findings/${testFindingId}/evidence`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(200);

      expect(res.body.findingId).toBe(testFindingId);
      expect(res.body.domainId).toBe(domainAId);
      expect(Array.isArray(res.body.observations)).toBe(true);
    });
  });

  // =========================================================================
  // 2. TENANT ISOLATION AT THE DATA & HTTP LAYER
  // =========================================================================
  describe('2. Cross-Tenant Data Isolation Enforcement', () => {
    let tenantBSnapshotId: string;
    let tenantBFindingId: string;

    beforeAll(async () => {
      const jobIdB = randomUUID();
      await prisma.understandingJob.create({
        data: { id: jobIdB, domainId: domainBId, status: 'PENDING', trigger: TriggerType.MANUAL },
      });

      const snapPayloadB: DiscoverySnapshot = {
        domainName: domainBName,
        http: { reachable: true, protocol: 'https', statusCode: 200, headers: { server: 'caddy' } },
      };

      const snapB = await snapshotService.saveSnapshot(domainBId, jobIdB, snapPayloadB);
      tenantBSnapshotId = snapB.id;

      const findingsB = await findingRuleEngine.evaluate({
        domainId: domainBId,
        snapshotId: snapB.id,
        snapshot: snapPayloadB,
      });
      await findingService.saveFindings(snapB.id, findingsB);
      await briefService.generate(snapB.id);

      const dbFindingB = await prisma.infrastructureFinding.findFirst({ where: { snapshotId: snapB.id } });
      if (dbFindingB) {
        tenantBFindingId = dbFindingB.id;
      }
    });

    it('User A attempting to view User B domain snapshots must receive 404 or empty list', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/domains/${domainBId}/snapshots`)
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.statusCode === 200) {
        expect(res.body.data).toHaveLength(0);
      } else {
        expect([401, 403, 404]).toContain(res.statusCode);
      }
    });

    it('User A attempting to view User B snapshot details must receive 404', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/snapshots/${tenantBSnapshotId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(404);
    });

    it('User A attempting to view User B brief must receive 404', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/snapshots/${tenantBSnapshotId}/brief`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(404);
    });

    it('User A attempting to view User B finding details must receive 404', async () => {
      if (tenantBFindingId) {
        await request(app.getHttpServer())
          .get(`/api/v1/findings/${tenantBFindingId}`)
          .set('Authorization', `Bearer ${userTokenA}`)
          .expect(404);
      }
    });
  });

  // =========================================================================
  // 3. ADVERSARIAL ID & PARAMETER VALIDATION
  // =========================================================================
  describe('3. Adversarial ID & Parameter Validation', () => {
    it('should reject or return empty dataset for malformed domain IDs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/domains/not-a-valid-uuid/snapshots')
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.statusCode === 200) {
        expect(res.body.data).toHaveLength(0);
      } else {
        expect([400, 404]).toContain(res.statusCode);
      }
    });

    it('should reject non-existent UUIDs with 404 Not Found', async () => {
      const nonexistentUUID = randomUUID();
      await request(app.getHttpServer())
        .get(`/api/v1/snapshots/${nonexistentUUID}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(404);
    });
  });
});
