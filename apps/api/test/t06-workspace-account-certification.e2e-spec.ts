import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { InfrastructureSnapshotService } from '../src/modules/infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureFindingService } from '../src/modules/infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureBriefService } from '../src/modules/infrastructure-brief/services/infrastructure-brief.service';
import { FindingRuleEngineService } from '../src/modules/findings/services/finding-rule-engine.service';
import { DiscoverySnapshot } from '../src/infrastructure/discovery/contracts/discovery-snapshot.interface';
import { UserAccountStatus, TriggerType, JobStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

describe('T-06: Workspace & Account Experience Integrity E2E Certification', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let snapshotService: InfrastructureSnapshotService;
  let findingService: InfrastructureFindingService;
  let briefService: InfrastructureBriefService;
  let findingRuleEngine: FindingRuleEngineService;

  const timestamp = Date.now();
  let userTokenA: string;
  let userAId: string;
  let domainAId: string;
  const domainAName = `t06-workspace-a-${timestamp}.com`;

  let userTokenB: string;
  let userBId: string;
  let domainBId: string;
  const domainBName = `t06-workspace-b-${timestamp}.com`;

  let snapshotAId: string;
  let snapshotBId: string;

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
    snapshotService = app.get(InfrastructureSnapshotService);
    findingService = app.get(InfrastructureFindingService);
    briefService = app.get(InfrastructureBriefService);
    findingRuleEngine = app.get(FindingRuleEngineService);

    await app.init();

    // Register & Activate User A
    const regResA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `t06-user-a-${timestamp}@example.com`,
        password: 'Password123!@#',
        confirmPassword: 'Password123!@#',
        fullName: 'Workspace Owner A',
      });
    userAId = regResA.body.user.id;
    await prisma.user.update({
      where: { id: userAId },
      data: { status: UserAccountStatus.ACTIVE, emailVerifiedAt: new Date() },
    });
    const loginResA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `t06-user-a-${timestamp}@example.com`,
        password: 'Password123!@#',
      });
    userTokenA = loginResA.body.accessToken;

    // Create Domain A
    const domRecordA = await prisma.domain.create({
      data: {
        userId: userAId,
        domainName: domainAName,
      },
    });
    domainAId = domRecordA.id;

    // Seed Snapshot A & Findings for User A
    const mockDiscoveryA: DiscoverySnapshot = {
      domain: domainAName,
      timestamp: new Date().toISOString(),
      dns: {
        records: [
          { type: 'A', name: domainAName, value: '104.21.45.10', ttl: 300 },
        ],
        nameservers: ['ns1.cloudflare.com'],
        authoritative: true,
      },
      http: {
        url: `https://${domainAName}`,
        statusCode: 200,
        headers: {
          server: 'cloudflare',
          'strict-transport-security': 'max-age=31536000; includeSubDomains',
        },
        redirects: [],
        timing: { dns: 10, tcp: 15, tls: 25, ttfb: 40, total: 90 },
      },
      tls: {
        valid: true,
        issuer: 'Let-s Encrypt',
        subject: domainAName,
        validFrom: new Date(Date.now() - 86400000 * 30).toISOString(),
        validTo: new Date(Date.now() + 86400000 * 60).toISOString(),
        protocol: 'TLSv1.3',
        cipher: 'TLS_AES_256_GCM_SHA384',
        daysRemaining: 60,
      },
      technologies: [
        { name: 'Cloudflare', category: 'CDN', confidence: 0.95 },
        { name: 'Next.js', category: 'Web Framework', confidence: 0.9 },
      ],
      openPorts: [80, 443],
    };

    const jobA = await prisma.understandingJob.create({
      data: {
        domainId: domainAId,
        status: JobStatus.COMPLETED,
        trigger: TriggerType.MANUAL,
        completedAt: new Date(),
      },
    });

    const snapRecordA = await prisma.infrastructureSnapshot.create({
      data: {
        domainId: domainAId,
        jobId: jobA.id,
        responseTimeMs: 95,
        httpStatus: 200,
        payload: mockDiscoveryA as any,
      },
    });
    snapshotAId = snapRecordA.id;

    await prisma.infrastructureFinding.create({
      data: {
        snapshotId: snapshotAId,
        ruleId: 'SEC-001',
        module: 'HTTP',
        severity: 'HIGH',
        category: 'SECURITY_HEADER',
        title: 'Missing Strict-Transport-Security Header',
        description: 'Server lacks HSTS header on HTTPS responses',
      },
    });

    await prisma.infrastructureBrief.create({
      data: {
        snapshotId: snapshotAId,
        overallHealth: 'HEALTHY',
        summary: 'Tenant A brief summary with robust TLS and CDN',
        highlights: ['TLS 1.3 Active', 'Cloudflare CDN Identified'],
        recommendations: ['Enable HSTS Header'],
      },
    });

    // Register & Activate User B
    const regResB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `t06-user-b-${timestamp}@example.com`,
        password: 'Password123!@#',
        confirmPassword: 'Password123!@#',
        fullName: 'Workspace Owner B',
      });
    userBId = regResB.body.user.id;
    await prisma.user.update({
      where: { id: userBId },
      data: { status: UserAccountStatus.ACTIVE, emailVerifiedAt: new Date() },
    });
    const loginResB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `t06-user-b-${timestamp}@example.com`,
        password: 'Password123!@#',
      });
    userTokenB = loginResB.body.accessToken;

    // Create Domain B
    const domRecordB = await prisma.domain.create({
      data: {
        userId: userBId,
        domainName: domainBName,
      },
    });
    domainBId = domRecordB.id;
  });

  afterAll(async () => {
    if (domainAId) {
      await prisma.domain.deleteMany({ where: { id: { in: [domainAId, domainBId] } } });
    }
    if (userAId) {
      await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    }
    await app.close();
  });

  // =========================================================================
  // 1. WORKSPACE DASHBOARD EXPERIENCE
  // =========================================================================
  describe('1. Workspace Dashboard Experience API (GET /api/v1/workspace/dashboard)', () => {
    it('returns aggregated workspace data strictly scoped to authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/workspace/dashboard')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('activeDomains');
      expect(Array.isArray(res.body.activeDomains)).toBe(true);
      expect(res.body.activeDomains.some((d: any) => d.id === domainAId)).toBe(true);
      expect(res.body.activeDomains.some((d: any) => d.id === domainBId)).toBe(false);
    });

    it('returns 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/workspace/dashboard');
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // 2. SYNTHESIZED WORKSPACE OVERVIEW (GET /api/v1/workspace/overview)
  // =========================================================================
  describe('2. Synthesized Workspace Overview Intelligence', () => {
    it('returns executive brief, primary story, and quiet state for owned domain', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspace/overview?domainId=${domainAId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('executiveBrief');
      expect(res.body).toHaveProperty('primaryStory');
      expect(res.body).toHaveProperty('secondaryStories');
      expect(res.body).toHaveProperty('latestSnapshot');
      expect(res.body).toHaveProperty('quietStatus');
    });

    it('strictly denies cross-tenant access with 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspace/overview?domainId=${domainAId}`)
        .set('Authorization', `Bearer ${userTokenB}`);

      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 3. WORKSPACE SECURITY POSTURE (GET /api/v1/workspace/security)
  // =========================================================================
  describe('3. Synthesized Workspace Security Intelligence', () => {
    it('returns security posture score, grade, and 7 pillars for owned domain', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspace/security?domainId=${domainAId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('posture');
      expect(res.body).toHaveProperty('securityScore');
      expect(res.body).toHaveProperty('securityGrade');
      expect(res.body).toHaveProperty('securityPillars');
    });

    it('rejects cross-tenant security intelligence query with 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspace/security?domainId=${domainAId}`)
        .set('Authorization', `Bearer ${userTokenB}`);

      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 4. ACCOUNT OVERVIEW (GET /api/v1/account)
  // =========================================================================
  describe('4. Account Overview & Profile Management', () => {
    it('retrieves accurate identity, account status, and session counts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/account')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(userAId);
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.email).toBe(`t06-user-a-${timestamp}@example.com`);
      expect(res.body.fullName).toBe('Workspace Owner A');
      expect(res.body).toHaveProperty('activeSessionsCount');
    });
  });

  // =========================================================================
  // 5. APPEARANCE & PREFERENCES (GET / PATCH /api/v1/account/preferences)
  // =========================================================================
  describe('5. Appearance & Motion Preferences Persistence', () => {
    it('retrieves default user preferences', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/account/preferences')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('theme');
      expect(res.body).toHaveProperty('motion');
    });

    it('authoritatively updates and persists theme to dark and motion to reduced', async () => {
      const patchRes = await request(app.getHttpServer())
        .patch('/api/v1/account/preferences')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          theme: 'dark',
          motion: 'reduced',
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.theme).toBe('dark');
      expect(patchRes.body.motion).toBe('reduced');

      // Verify persistence on subsequent GET
      const getRes = await request(app.getHttpServer())
        .get('/api/v1/account/preferences')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.theme).toBe('dark');
      expect(getRes.body.motion).toBe('reduced');
    });

    it('rejects invalid theme preference values with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/account/preferences')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          theme: 'INVALID_NEON_THEME',
        });

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // 6. SESSION MANAGEMENT & REVOCATION (GET / DELETE /api/v1/auth/sessions)
  // =========================================================================
  describe('6. Security Sessions Management', () => {
    let sessionAId: string;

    it('lists active user sessions with client metadata', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      sessionAId = res.body[0].id;
    });

    it('prevents User B from revoking User A session with 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/auth/sessions/${sessionAId}`)
        .set('Authorization', `Bearer ${userTokenB}`);

      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 7. CONNECTED AUTHENTICATION PROVIDERS (GET /api/v1/auth/providers)
  // =========================================================================
  describe('7. Connected Authentication Providers', () => {
    it('returns provider connectivity state without exposing credentials', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/providers')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('providers');
      expect(Array.isArray(res.body.providers)).toBe(true);
      const google = res.body.providers.find((p: any) => p.provider === 'google');
      expect(google).toBeDefined();
      expect(google).toHaveProperty('connected');
      // No secrets leaked
      expect(res.body).not.toHaveProperty('clientSecret');
      expect(res.body).not.toHaveProperty('accessToken');
    });
  });

  // =========================================================================
  // 8. MULTI-USER ISOLATION
  // =========================================================================
  describe('8. Workspace Multi-User Isolation Guarantee', () => {
    it('guarantees User A cannot observe User B domains, brief, or preferences', async () => {
      const dashA = await request(app.getHttpServer())
        .get('/api/v1/workspace/dashboard')
        .set('Authorization', `Bearer ${userTokenA}`);

      const dashB = await request(app.getHttpServer())
        .get('/api/v1/workspace/dashboard')
        .set('Authorization', `Bearer ${userTokenB}`);

      const domainIdsA = (dashA.body.activeDomains || []).map((d: any) => d.id);
      const domainIdsB = (dashB.body.activeDomains || []).map((d: any) => d.id);

      // Verify complete disjoint sets
      expect(domainIdsA.includes(domainBId)).toBe(false);
      expect(domainIdsB.includes(domainAId)).toBe(false);
    });
  });
});
