import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { UserAccountStatus, TriggerType } from '@prisma/client';
import { randomUUID } from 'crypto';

describe('T-07: Security & Trust Integrity Adversarial Certification Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const testJwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-key-atlas-v1-super-secure-min-32-chars';

  // Tenant A
  let userTokenA: string;
  let userAId: string;
  let domainAId: string;
  const domainAName = `t07-tenant-a-${timestamp}.com`;
  let snapshotAId: string;
  let findingAId: string;
  let jobAId: string;
  let sessionAId: string;

  // Tenant B
  let userTokenB: string;
  let userBId: string;
  let domainBId: string;
  const domainBName = `t07-tenant-b-${timestamp}.com`;
  let snapshotBId: string;
  let findingBId: string;
  let jobBId: string;
  let sessionBId: string;

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
    await app.init();

    // 1. Create & Activate Tenant A
    const regResA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `t07-user-a-${timestamp}@example.com`,
        password: 'Password123!@#',
        confirmPassword: 'Password123!@#',
        fullName: 'Tenant A Primary Owner',
      });
    userAId = regResA.body.user.id;
    await prisma.user.update({
      where: { id: userAId },
      data: { status: UserAccountStatus.ACTIVE, emailVerifiedAt: new Date() },
    });
    const loginResA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `t07-user-a-${timestamp}@example.com`,
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

    // Seed Job A, Snapshot A, Finding A & Brief A
    jobAId = randomUUID();
    await prisma.understandingJob.create({
      data: {
        id: jobAId,
        domainId: domainAId,
        status: 'COMPLETED',
        trigger: TriggerType.MANUAL,
      },
    });

    const mockDiscoveryA = {
      domain: domainAName,
      timestamp: new Date().toISOString(),
      dns: { records: [{ type: 'A', name: domainAName, value: '104.21.45.1', ttl: 300 }], nameservers: ['ns1.example.com'], authoritative: true },
      http: { url: `https://${domainAName}`, statusCode: 200, headers: { server: 'nginx' }, redirects: [], timing: { dns: 10, tcp: 10, tls: 20, ttfb: 30, total: 70 } },
      tls: { valid: true, issuer: 'Let-s Encrypt', subject: domainAName, validFrom: new Date().toISOString(), validTo: new Date(Date.now() + 86400000 * 90).toISOString(), protocol: 'TLSv1.3', cipher: 'TLS_AES_256_GCM_SHA384', daysRemaining: 90 },
      technologies: [{ name: 'Nginx', category: 'Web Server', confidence: 0.9 }],
      openPorts: [80, 443],
    };

    const snapA = await prisma.infrastructureSnapshot.create({
      data: {
        domainId: domainAId,
        jobId: jobAId,
        responseTimeMs: 70,
        httpStatus: 200,
        payload: mockDiscoveryA as any,
      },
    });
    snapshotAId = snapA.id;

    const findA = await prisma.infrastructureFinding.create({
      data: {
        snapshotId: snapshotAId,
        ruleId: 'SEC-001',
        module: 'HTTP',
        severity: 'HIGH',
        category: 'SECURITY_HEADER',
        title: 'Missing Strict Transport Security',
        description: 'Server lacks HSTS header',
      },
    });
    findingAId = findA.id;

    await prisma.infrastructureBrief.create({
      data: {
        snapshotId: snapshotAId,
        overallHealth: 'DEGRADED',
        summary: 'Tenant A brief summary',
        highlights: ['HSTS missing'],
        recommendations: ['Enable HSTS header'],
      },
    });

    // Capture Session A ID
    const sessionsResA = await request(app.getHttpServer())
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${userTokenA}`);
    if (sessionsResA.body && sessionsResA.body.length > 0) {
      sessionAId = sessionsResA.body[0].id;
    }

    // 2. Create & Activate Tenant B
    const regResB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `t07-user-b-${timestamp}@example.com`,
        password: 'Password123!@#',
        confirmPassword: 'Password123!@#',
        fullName: 'Tenant B Primary Owner',
      });
    userBId = regResB.body.user.id;
    await prisma.user.update({
      where: { id: userBId },
      data: { status: UserAccountStatus.ACTIVE, emailVerifiedAt: new Date() },
    });
    const loginResB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `t07-user-b-${timestamp}@example.com`,
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

    // Seed Job B, Snapshot B, Finding B & Brief B
    jobBId = randomUUID();
    await prisma.understandingJob.create({
      data: {
        id: jobBId,
        domainId: domainBId,
        status: 'COMPLETED',
        trigger: TriggerType.MANUAL,
      },
    });

    const mockDiscoveryB = {
      domain: domainBName,
      timestamp: new Date().toISOString(),
      dns: { records: [{ type: 'A', name: domainBName, value: '104.21.45.2', ttl: 300 }], nameservers: ['ns2.example.com'], authoritative: true },
      http: { url: `https://${domainBName}`, statusCode: 200, headers: { server: 'apache' }, redirects: [], timing: { dns: 10, tcp: 10, tls: 20, ttfb: 30, total: 70 } },
      tls: { valid: true, issuer: 'Let-s Encrypt', subject: domainBName, validFrom: new Date().toISOString(), validTo: new Date(Date.now() + 86400000 * 90).toISOString(), protocol: 'TLSv1.3', cipher: 'TLS_AES_256_GCM_SHA384', daysRemaining: 90 },
      technologies: [{ name: 'Apache', category: 'Web Server', confidence: 0.9 }],
      openPorts: [80, 443],
    };

    const snapB = await prisma.infrastructureSnapshot.create({
      data: {
        domainId: domainBId,
        jobId: jobBId,
        responseTimeMs: 80,
        httpStatus: 200,
        payload: mockDiscoveryB as any,
      },
    });
    snapshotBId = snapB.id;

    const findB = await prisma.infrastructureFinding.create({
      data: {
        snapshotId: snapshotBId,
        ruleId: 'SEC-002',
        module: 'HTTP',
        severity: 'MEDIUM',
        category: 'SECURITY_HEADER',
        title: 'Missing Secure Flag on Cookie',
        description: 'Cookie set without Secure flag',
      },
    });
    findingBId = findB.id;

    await prisma.infrastructureBrief.create({
      data: {
        snapshotId: snapshotBId,
        overallHealth: 'HEALTHY',
        summary: 'Tenant B brief summary',
        highlights: ['Cookie security attention'],
        recommendations: ['Enable Secure attribute'],
      },
    });

    // Capture Session B ID
    const sessionsResB = await request(app.getHttpServer())
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${userTokenB}`);
    if (sessionsResB.body && sessionsResB.body.length > 0) {
      sessionBId = sessionsResB.body[0].id;
    }
  });

  afterAll(async () => {
    const domainIds = [domainAId, domainBId].filter(Boolean);
    if (domainIds.length > 0) {
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
  // 1. AUTHENTICATION & AUTHORIZATION ADVERSARIAL ATTACKS
  // =========================================================================
  describe('1. Authentication & Authorization Adversarial Attacks', () => {
    it('rejects "alg: none" unverified JWT signature attack with 401', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: userAId, email: `t07-user-a-${timestamp}@example.com`, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
      const noneToken = `${header}.${payload}.`;

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${noneToken}`);

      expect(res.status).toBe(401);
    });

    it('rejects expired JWT token with 401 Unauthorized', async () => {
      const expiredToken = jwt.sign(
        { sub: userAId, email: `t07-user-a-${timestamp}@example.com`, exp: Math.floor(Date.now() / 1000) - 3600 },
        testJwtSecret,
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it('rejects token forged with wrong secret with 401 Unauthorized', async () => {
      const forgedToken = jwt.sign(
        { sub: userAId, email: `t07-user-a-${timestamp}@example.com` },
        'attacker-evil-forged-secret-key-not-matching',
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
    });

    it('rejects tampered payload signature with 401 Unauthorized', async () => {
      const parts = userTokenA.split('.');
      const modifiedPayload = parts[1].slice(0, -2) + 'AA';
      const tamperedToken = `${parts[0]}.${modifiedPayload}.${parts[2]}`;

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.status).toBe(401);
    });

    it('rejects missing or malformed Authorization headers with 401 Unauthorized', async () => {
      const headers = [
        '',
        'Bearer',
        'Bearer ',
        'Bearer invalid-token-structure',
        'Basic dXNlcjpwYXNz',
        'Token random-token-string',
      ];

      for (const authHeader of headers) {
        const res = await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .set('Authorization', authHeader);

        expect(res.status).toBe(401);
      }
    });

    it('rejects standard user token attempting Admin privileged APIs', async () => {
      const adminEndpoints = [
        { method: 'get', path: '/api/v1/admin/users' },
        { method: 'get', path: '/api/v1/admin/audit' },
        { method: 'get', path: '/api/v1/admin/system' },
      ];

      for (const endpoint of adminEndpoints) {
        const res = await (request(app.getHttpServer()) as any)[endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${userTokenA}`);

        expect([401, 403, 404].includes(res.status)).toBe(true);
      }
    });

    it('rejects deactivated account from authenticating or accessing data', async () => {
      // Deactivate User A with current password
      const deactRes = await request(app.getHttpServer())
        .post('/api/v1/account/deactivate')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ currentPassword: 'Password123!@#' });

      expect(deactRes.status).toBe(200);

      // Attempt login as deactivated user
      const loginDeactivated = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `t07-user-a-${timestamp}@example.com`,
          password: 'Password123!@#',
        });

      expect(loginDeactivated.status).toBe(401);

      // Reactivate User A
      await prisma.user.update({
        where: { id: userAId },
        data: { status: UserAccountStatus.ACTIVE },
      });

      // Login again to obtain refreshed active token
      const reLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `t07-user-a-${timestamp}@example.com`,
          password: 'Password123!@#',
        });

      expect(reLogin.status).toBe(200);
      userTokenA = reLogin.body.accessToken;
    });

    it('enforces refresh token rotation and rejects replayed (already consumed) refresh tokens', async () => {
      // Register a dedicated user for refresh rotation testing
      const rotEmail = `t07-rotation-${timestamp}@example.com`;
      const regRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: rotEmail,
          password: 'Password123!@#',
          confirmPassword: 'Password123!@#',
          fullName: 'Rotation QA User',
        });
      const rotUserId = regRes.body.user.id;
      await prisma.user.update({
        where: { id: rotUserId },
        data: { status: UserAccountStatus.ACTIVE, emailVerifiedAt: new Date() },
      });

      // Login to get fresh refresh token
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: rotEmail,
          password: 'Password123!@#',
        });

      const initialRefreshToken = loginRes.body.refreshToken;
      expect(initialRefreshToken).toBeDefined();

      // 1st Refresh: Valid rotation with CSRF
      const refreshRes1 = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', ['nebula_csrf_token=csrf_valid_token_123'])
        .set('x-csrf-token', 'csrf_valid_token_123')
        .send({ refreshToken: initialRefreshToken });

      expect(refreshRes1.status).toBe(200);
      expect(refreshRes1.body).toHaveProperty('accessToken');
      expect(refreshRes1.body).toHaveProperty('refreshToken');
      const secondRefreshToken = refreshRes1.body.refreshToken;
      expect(secondRefreshToken).not.toBe(initialRefreshToken);

      // 2nd Refresh using old consumed token (Replay Attack)
      const replayRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', ['nebula_csrf_token=csrf_valid_token_123'])
        .set('x-csrf-token', 'csrf_valid_token_123')
        .send({ refreshToken: initialRefreshToken });

      // Must be rejected with 401 Unauthorized
      expect(replayRes.status).toBe(401);

      // Clean up rotation test user
      await prisma.userSession.deleteMany({ where: { userId: rotUserId } });
      await prisma.user.delete({ where: { id: rotUserId } });
    });

    it('rejects client-side role forgery and privilege escalation during registration', async () => {
      const forgeEmail = `forgery-${timestamp}@example.com`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: forgeEmail,
          password: 'Password123!@#',
          confirmPassword: 'Password123!@#',
          fullName: 'Attacker Forged Admin',
          role: 'ADMIN',
          isAdmin: true,
          isSuperAdmin: true,
        });

      // Whitelist validation with forbidNonWhitelisted must reject 400
      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // 2. TENANT ISOLATION & CONCEALMENT SEMANTICS
  // =========================================================================
  describe('2. Tenant Isolation & Concealment Semantics', () => {
    it('Tenant A attempting to fetch Tenant B domain returns 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/domains/${domainBId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.message).not.toContain(domainBName);
    });

    it('Tenant A attempting to delete Tenant B domain returns 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/domains/${domainBId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(404);
    });

    it('Tenant A attempting to read Tenant B snapshot returns 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/snapshots/${snapshotBId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(404);
    });

    it('Tenant A attempting to read Tenant B snapshot brief returns 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/snapshots/${snapshotBId}/brief`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(404);
    });

    it('Tenant A attempting to access Tenant B findings returns 404 Not Found', async () => {
      if (findingBId) {
        const res = await request(app.getHttpServer())
          .get(`/api/v1/findings/${findingBId}`)
          .set('Authorization', `Bearer ${userTokenA}`);

        expect(res.status).toBe(404);
      }
    });

    it('Tenant A querying workspace overview with Tenant B domainId returns 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspace/overview?domainId=${domainBId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(404);
    });

    it('Tenant A querying workspace security posture with Tenant B domainId returns 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspace/security?domainId=${domainBId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(404);
    });

    it('Tenant A revoking Tenant B active session returns 404 Not Found', async () => {
      if (sessionBId) {
        const res = await request(app.getHttpServer())
          .delete(`/api/v1/auth/sessions/${sessionBId}`)
          .set('Authorization', `Bearer ${userTokenA}`);

        expect(res.status).toBe(404);
      }
    });

    it('Random non-existent UUIDs return uniform 404 without existence oracle', async () => {
      const fakeUuid = randomUUID();
      const res = await request(app.getHttpServer())
        .get(`/api/v1/domains/${fakeUuid}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 3. INPUT & INJECTION ATTACKS
  // =========================================================================
  describe('3. Input & Injection Attacks Defense', () => {
    it('safely rejects SQL/Prisma injection in domain creation payload', async () => {
      const sqlPayloads = [
        "atlas.com'; DROP TABLE \"User\"; --",
        "atlas.com' OR '1'='1",
        "atlas.com' UNION SELECT * FROM \"User\" --",
      ];

      for (const payload of sqlPayloads) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/domains')
          .set('Authorization', `Bearer ${userTokenA}`)
          .send({ domainName: payload });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(JSON.stringify(res.body)).not.toContain('prisma:error');
        expect(JSON.stringify(res.body)).not.toContain('syntax error');
      }
    });

    it('safely handles XSS / HTML injection payloads without executing or corrupting state', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>.com',
        '"><svg onload=alert(1)>.com',
        'javascript:alert(1)',
      ];

      for (const payload of xssPayloads) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/domains')
          .set('Authorization', `Bearer ${userTokenA}`)
          .send({ domainName: payload });

        expect(res.status).toBe(400);
      }
    });

    it('safely handles prototype pollution payloads without polluting Object prototype', async () => {
      const protoPayload = JSON.parse('{"domainName": "valid-proto-test.com", "__proto__": {"polluted": true}, "constructor": {"prototype": {"admin": true}}}');

      const res = await request(app.getHttpServer())
        .post('/api/v1/domains')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send(protoPayload);

      expect((Object.prototype as any).polluted).toBeUndefined();
      expect((Object.prototype as any).admin).toBeUndefined();

      if (res.body?.id) {
        await prisma.domain.delete({ where: { id: res.body.id } });
      }
    });

    it('safely handles path traversal attempts in endpoints', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/domains/../../etc/passwd')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect([400, 404].includes(res.status)).toBe(true);
    });

    it('safely handles malformed non-UUID path parameters without 500 error', async () => {
      const malformedParams = [
        'not-a-valid-uuid',
        '12345',
        'null',
        'undefined',
        '00000000-0000-0000-0000-000000000000_extra',
      ];

      for (const param of malformedParams) {
        const res = await request(app.getHttpServer())
          .get(`/api/v1/snapshots/${param}`)
          .set('Authorization', `Bearer ${userTokenA}`);

        expect([400, 404].includes(res.status)).toBe(true);
      }
    });

    it('safely handles null byte injections in domain inputs', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/domains')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ domainName: 'atlas\0.example.com' });

      expect(res.status).toBe(400);
    });

    it('safely handles deeply nested JSON structures without crashing', async () => {
      let nested: any = { value: 'leaf' };
      for (let i = 0; i < 50; i++) {
        nested = { nested };
      }

      const res = await request(app.getHttpServer())
        .post('/api/v1/domains')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ domainName: 'valid-test.com', extra: nested });

      // Non-whitelisted extra field rejected with 400
      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // 4. CSRF / CORS & BROWSER SECURITY HEADERS
  // =========================================================================
  describe('4. Security Headers & Browser Hardening', () => {
    it('attaches Helmet security headers to HTTP responses', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health');

      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(res.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(res.headers).toHaveProperty('referrer-policy', 'strict-origin-when-cross-origin');
    });

    it('rejects state-modifying cookie-based request when CSRF token is missing or mismatched with 403', async () => {
      // Send refresh request with cookie but without matching X-CSRF-Token header
      const mismatchRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', ['nebula_csrf_token=valid_cookie_value'])
        .set('x-csrf-token', 'attacker_forged_mismatched_token')
        .send({ refreshToken: 'some_token' });

      expect(mismatchRes.status).toBe(403);
      expect(mismatchRes.body.message).toContain('CSRF');
    });
  });

  // =========================================================================
  // 5. SECRETS & SENSITIVE DATA EXPOSURE AUDIT
  // =========================================================================
  describe('5. Secrets & Sensitive Data Leakage Protection', () => {
    it('verifies /me and login responses NEVER return password hash or sensitive credentials', async () => {
      const meRes = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body).not.toHaveProperty('password');
      expect(meRes.body).not.toHaveProperty('passwordHash');
      expect(meRes.body).not.toHaveProperty('salt');
      expect(meRes.body).not.toHaveProperty('argon2');
      expect(meRes.body).not.toHaveProperty('refreshToken');
    });

    it('verifies connected authentication providers never leak client secret', async () => {
      const provRes = await request(app.getHttpServer())
        .get('/api/v1/auth/providers')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(provRes.status).toBe(200);
      expect(provRes.body).not.toHaveProperty('clientSecret');
      expect(provRes.body).not.toHaveProperty('secret');
      expect(provRes.body).not.toHaveProperty('token');
    });

    it('verifies error responses do not leak stack traces or internal implementation details', async () => {
      const errRes = await request(app.getHttpServer())
        .post('/api/v1/domains')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ domainName: '' });

      expect(errRes.status).toBe(400);
      expect(errRes.body).not.toHaveProperty('stack');
      expect(errRes.body).not.toHaveProperty('stackTrace');
      expect(JSON.stringify(errRes.body)).not.toContain('/home/');
      expect(JSON.stringify(errRes.body)).not.toContain('node_modules');
    });
  });

  // =========================================================================
  // 6. CRYPTOGRAPHIC INTEGRITY & PASSWORD HASHING
  // =========================================================================
  describe('6. Cryptographic & Credential Security Integrity', () => {
    it('verifies persisted user password in database is Argon2id hashed', async () => {
      const userRecord = await prisma.user.findUnique({
        where: { id: userAId },
        select: { passwordHash: true },
      });

      expect(userRecord).toBeDefined();
      expect(userRecord?.passwordHash).toBeDefined();
      expect(userRecord?.passwordHash.startsWith('$argon2id$')).toBe(true);
      expect(userRecord?.passwordHash).not.toBe('Password123!@#');
    });
  });

  // =========================================================================
  // 7. RATE LIMITING & ABUSE PROTECTION
  // =========================================================================
  describe('7. Rate Limiting & Abuse Defense', () => {
    it('attaches rate limit headers to sensitive endpoints', async () => {
      const loginRateRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `t07-user-a-${timestamp}@example.com`,
          password: 'Password123!@#',
        });

      expect(loginRateRes.headers).toHaveProperty('x-ratelimit-limit');
      expect(loginRateRes.headers).toHaveProperty('x-ratelimit-remaining');
      expect(loginRateRes.headers).toHaveProperty('x-ratelimit-reset');
    });
  });
});
