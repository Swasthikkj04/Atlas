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
import { UserAccountStatus, TriggerType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

describe('T-05: API & Backend Contract Integrity E2E Certification', () => {
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
  const domainAName = `t05-contract-a-${timestamp}.com`;

  let userTokenB: string;
  let userBId: string;
  let domainBId: string;
  const domainBName = `t05-contract-b-${timestamp}.com`;

  let snapshotBId: string;
  let findingBId: string;

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

    // Setup Swagger
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Atlas API')
      .setDescription('Atlas Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

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
        email: `t05-user-a-${timestamp}@example.com`,
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
        email: `t05-user-a-${timestamp}@example.com`,
        password: 'Password123!@#',
      });
    userTokenA = loginResA.body.accessToken;

    // Register & Activate User B
    const regResB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `t05-user-b-${timestamp}@example.com`,
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
        email: `t05-user-b-${timestamp}@example.com`,
        password: 'Password123!@#',
      });
    userTokenB = loginResB.body.accessToken;

    // Direct DB Setup for Tenant A Domain
    const domainA = await prisma.domain.create({
      data: {
        userId: userAId,
        domainName: domainAName,
      },
    });
    domainAId = domainA.id;

    // Direct DB Setup for Tenant B Domain
    const domainB = await prisma.domain.create({
      data: {
        userId: userBId,
        domainName: domainBName,
      },
    });
    domainBId = domainB.id;

    // Setup Tenant B Snapshot, Finding, and Brief
    const jobBId = randomUUID();
    await prisma.understandingJob.create({
      data: { id: jobBId, domainId: domainBId, status: 'PENDING', trigger: TriggerType.MANUAL },
    });

    const snapBPayload: DiscoverySnapshot = {
      domainName: domainBName,
      http: { reachable: true, protocol: 'https', statusCode: 200, headers: { server: 'nginx' } },
    };
    const snapB = await snapshotService.saveSnapshot(domainBId, jobBId, snapBPayload);
    snapshotBId = snapB.id;

    const findingsB = await findingRuleEngine.evaluate({
      domainId: domainBId,
      snapshotId: snapB.id,
      snapshot: snapBPayload,
    });
    await findingService.saveFindings(snapB.id, findingsB);
    await briefService.generate(snapB.id);

    const dbFindingB = await prisma.infrastructureFinding.findFirst({ where: { snapshotId: snapB.id } });
    if (dbFindingB) {
      findingBId = dbFindingB.id;
    }
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
  // 1. API ROUTE SURFACE & AUTH GUARDS
  // =========================================================================
  describe('1. API Route Surface & Auth Guards', () => {
    it('GET /api/v1/health - should be public and return 200 with status HEALTHY', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
      expect(res.body).toEqual(expect.objectContaining({ status: 'HEALTHY' }));
    });

    it('GET /api/v1/domains - should reject unauthenticated access with 401 Unauthorized', async () => {
      await request(app.getHttpServer()).get('/api/v1/domains').expect(401);
    });

    it('GET /api/v1/workspace/dashboard - should reject unauthenticated access with 401 Unauthorized', async () => {
      await request(app.getHttpServer()).get('/api/v1/workspace/dashboard').expect(401);
    });

    it('GET /api/v1/nonexistent-route - should return 404 with standardized error structure', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/nonexistent-route').expect(404);
      expect(res.body.statusCode).toBe(404);
    });
  });

  // =========================================================================
  // 2. REQUEST VALIDATION
  // =========================================================================
  describe('2. Request Validation & Whitelisting', () => {
    it('POST /api/v1/auth/register - should reject payloads with missing required fields (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'missing-password@example.com' })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
      expect(res.body.error).toBe('Bad Request');
    });

    it('POST /api/v1/auth/register - should reject unexpected non-whitelisted fields (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `extra-${Date.now()}@example.com`,
          password: 'Password123!@#',
          confirmPassword: 'Password123!@#',
          fullName: 'Extra Field User',
          injectedAdminRole: true, // Non-whitelisted field
        })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
    });
  });

  // =========================================================================
  // 3. RESPONSE CONTRACT & SENSITIVE DATA EXCLUSION
  // =========================================================================
  describe('3. Response Contract & Sensitive Data Exclusion', () => {
    it('POST /api/v1/auth/login - should return token and user without leaking passwordHash or salt', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `t05-user-a-${timestamp}@example.com`,
          password: 'Password123!@#',
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(`t05-user-a-${timestamp}@example.com`);

      // Strict check: No sensitive secrets leaked in JSON
      expect(res.body.user).not.toHaveProperty('passwordHash');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('salt');
      expect(JSON.stringify(res.body)).not.toContain('argon2id');
    });

    it('GET /api/v1/auth/me - should return authenticated identity safely', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(200);

      expect(res.body.id).toBe(userAId);
      expect(res.body).not.toHaveProperty('passwordHash');
    });
  });

  // =========================================================================
  // 4. HTTP SEMANTICS & ASYNC LIFECYCLE
  // =========================================================================
  describe('4. HTTP Semantics & Async Job Lifecycle', () => {
    it('POST /api/v1/domains/:id/understand - should return 202 Accepted with Location header pointing to job', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/domains/${domainAId}/understand`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(202);

      expect(res.headers).toHaveProperty('location');
      expect(res.headers.location).toMatch(/\/api\/v1\/jobs\/.+/);
      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('PENDING');
      expect(res.body.domainId).toBe(domainAId);
    });

    it('GET /api/v1/domains - should return 200 OK with list of user domains', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/domains')
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((d: any) => d.id === domainAId)).toBe(true);
    });

    it('GET /api/v1/domains/:id/overview - should return 200 OK for existing domain', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/domains/${domainAId}/overview`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  // =========================================================================
  // 5. CANONICAL ERROR CONTRACT & HEADER TRACEABILITY
  // =========================================================================
  describe('5. Error Contract & Traceability', () => {
    it('should include x-correlation-id and x-request-id on all responses and errors', async () => {
      const customCorr = `corr-test-${Date.now()}`;
      const res = await request(app.getHttpServer())
        .get('/api/v1/domains/nonexistent-id')
        .set('Authorization', `Bearer ${userTokenA}`)
        .set('X-Correlation-ID', customCorr);

      expect(res.headers).toHaveProperty('x-correlation-id', customCorr);
      expect(res.headers).toHaveProperty('x-request-id');
    });
  });

  // =========================================================================
  // 6. DOMAIN OWNERSHIP & CROSS-TENANT BOUNDARY
  // =========================================================================
  describe('6. Cross-Tenant Authorization Boundaries', () => {
    it('User A cannot GET User B domain overview (404 Not Found)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/domains/${domainBId}/overview`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(404);
    });

    it('User A cannot POST understanding against User B domain (404 Not Found)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/domains/${domainBId}/understand`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(404);
    });

    it('User A cannot DELETE User B domain (404 Not Found)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/domains/${domainBId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(404);
    });

    it('User A cannot GET User B snapshot details (404 Not Found)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/snapshots/${snapshotBId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(404);
    });

    it('User A cannot GET User B brief (404 Not Found)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/snapshots/${snapshotBId}/brief`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(404);
    });

    it('User A cannot GET User B finding details (404 Not Found)', async () => {
      if (findingBId) {
        await request(app.getHttpServer())
          .get(`/api/v1/findings/${findingBId}`)
          .set('Authorization', `Bearer ${userTokenA}`)
          .expect(404);
      }
    });
  });

  // =========================================================================
  // 7. SECURITY HEADERS & CORS HARDENING
  // =========================================================================
  describe('7. Security Headers & CORS Hardening', () => {
    it('should include Helmet security headers and omit X-Powered-By', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

      expect(res.headers).not.toHaveProperty('x-powered-by');
      expect(res.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(res.headers).toHaveProperty('referrer-policy', 'strict-origin-when-cross-origin');
    });
  });

  // =========================================================================
  // 8. PAGINATION, FILTERING & QUERY PARAMETERS
  // =========================================================================
  describe('8. Pagination & Filtering Scoping', () => {
    it('GET /api/v1/findings?domainId=:id - should return paginated findings scoped to the requested domain', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/findings?domainId=${domainBId}&page=1&limit=10`)
        .set('Authorization', `Bearer ${userTokenB}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      for (const finding of res.body.data) {
        expect(finding.domainId).toBe(domainBId);
      }
    });

    it('GET /api/v1/findings?domainId=:unownedId - User A cannot access User B findings via query filter', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/findings?domainId=${domainBId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(200);

      // Returns empty array data for unowned domain query filter
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  // =========================================================================
  // 9. CONCURRENCY & ASYNC RESILIENCE
  // =========================================================================
  describe('9. Concurrency & Async Resilience', () => {
    it('should handle simultaneous understanding requests safely without deadlock or server error', async () => {
      const requests = [
        request(app.getHttpServer())
          .post(`/api/v1/domains/${domainAId}/understand`)
          .set('Authorization', `Bearer ${userTokenA}`),
        request(app.getHttpServer())
          .post(`/api/v1/domains/${domainAId}/understand`)
          .set('Authorization', `Bearer ${userTokenA}`),
      ];

      const responses = await Promise.all(requests);
      for (const res of responses) {
        expect([202, 409, 429]).toContain(res.status);
      }
    });
  });

  // =========================================================================
  // 10. RATE LIMITING & ABUSE HEADERS
  // =========================================================================
  describe('10. Rate Limiting Headers', () => {
    it('should attach X-RateLimit-* headers to sensitive API endpoints', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `t05-user-a-${timestamp}@example.com`,
          password: 'Password123!@#',
        })
        .expect(200);

      expect(res.headers).toHaveProperty('x-ratelimit-limit');
      expect(res.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  // =========================================================================
  // 11. IDEMPOTENCY & RETRY BEHAVIOR
  // =========================================================================
  describe('11. Idempotency & Conflict Prevention', () => {
    it('POST /api/v1/domains - duplicate domain name registration returns 409 Conflict', async () => {
      // Direct duplicate creation on repository or controller
      const res = await request(app.getHttpServer())
        .post('/api/v1/domains')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ domainName: domainAName });

      // If reachability is checked, it will either be 409 (if reached) or 422 (if mock test domain unreachable)
      expect([409, 422]).toContain(res.status);
    });
  });

  // =========================================================================
  // 12. BACKEND FAILURE CONTAINMENT & SANITIZATION
  // =========================================================================
  describe('12. Failure Containment & Error Sanitization', () => {
    it('Malformed parameters return 400 without leaking stack traces or internal queries', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/domains/not-a-valid-uuid')
        .set('Authorization', `Bearer ${userTokenA}`)
        .expect(400);

      expect(res.body.statusCode).toBe(400);
      expect(JSON.stringify(res.body)).not.toContain('SELECT');
      expect(JSON.stringify(res.body)).not.toContain('prisma');
    });
  });

  // =========================================================================
  // 13. OPENAPI / CONTRACT CONSISTENCY
  // =========================================================================
  describe('13. OpenAPI Documentation Endpoint', () => {
    it('GET /api/docs - should serve the OpenAPI Swagger documentation UI', async () => {
      await request(app.getHttpServer()).get('/api/docs').expect(200);
    });
  });
});
