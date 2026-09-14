import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from './app.module';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { PasswordHashingService } from './common/security/password-hashing';
import { UserAccountStatus, OAuthProvider } from '@prisma/client';
import { createHash, createHmac, randomBytes } from 'crypto';

describe('T-02: Authentication & Identity Integrity Certification Test Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const userAEmail = `t02-user-a-${timestamp}@example.com`;
  const userBEmail = `t02-user-b-${timestamp}@example.com`;
  const initialPassword = 'StrongPassword123!@#';
  const newPassword = 'NewStrongPassword456!@#';

  let userAId: string;
  let userAToken: string;
  let userARefreshToken: string;

  let userBId: string;
  let userBToken: string;

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
  });

  afterAll(async () => {
    if (userAId || userBId) {
      const ids = [userAId, userBId].filter(Boolean);
      await prisma.userSession.deleteMany({ where: { userId: { in: ids } } });
      await prisma.oAuthAccount.deleteMany({ where: { userId: { in: ids } } });
      await prisma.domain.deleteMany({ where: { userId: { in: ids } } });
      await prisma.accountReactivationToken.deleteMany({
        where: { userId: { in: ids } },
      });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await app.close();
  });

  // =========================================================================
  // 1. REGISTRATION INTEGRITY
  // =========================================================================
  describe('1. Registration Flow & Input / Password Hardening', () => {
    it('should successfully register User A with sanitized response (no password/hash/tokens exposed)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: userAEmail,
          password: initialPassword,
          confirmPassword: initialPassword,
          fullName: 'Alice Integrity',
        })
        .expect(201);

      expect(res.body.message).toMatch(/successful/i);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('email', userAEmail);
      expect(res.body.user).toHaveProperty('fullName', 'Alice Integrity');

      // Security assertions: no sensitive credentials leaked
      expect(res.body.user).not.toHaveProperty('passwordHash');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('accessToken');
      expect(res.body).not.toHaveProperty('refreshToken');

      userAId = res.body.user.id;

      // Verify Argon2id hash in database
      const dbUser = await prisma.user.findUnique({ where: { id: userAId } });
      expect(dbUser).toBeDefined();
      expect(dbUser?.passwordHash).toMatch(/^\$argon2id\$/);
      expect(dbUser?.passwordHash).not.toEqual(initialPassword);

      // Activate user for testing login
      await prisma.user.update({
        where: { id: userAId },
        data: {
          status: UserAccountStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
      });
    });

    it('should reject duplicate registration with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: userAEmail,
          password: initialPassword,
          confirmPassword: initialPassword,
          fullName: 'Alice Duplicate',
        })
        .expect(409);

      expect(res.body).toHaveProperty('statusCode', 409);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it('should reject invalid input and weak passwords with 400 Bad Request', async () => {
      // Invalid email
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: initialPassword,
          confirmPassword: initialPassword,
          fullName: 'Invalid Email',
        })
        .expect(400);

      // Password mismatch
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `mismatch-${timestamp}@example.com`,
          password: initialPassword,
          confirmPassword: 'DifferentPassword123!',
          fullName: 'Mismatch',
        })
        .expect(400);

      // Short password (< 8 chars)
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `short-${timestamp}@example.com`,
          password: '123',
          confirmPassword: '123',
          fullName: 'Short Password',
        })
        .expect(400);
    });

    it('should register and activate User B for cross-tenant boundary testing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: userBEmail,
          password: initialPassword,
          confirmPassword: initialPassword,
          fullName: 'Bob Isolation',
        })
        .expect(201);

      userBId = res.body.user.id;
      await prisma.user.update({
        where: { id: userBId },
        data: {
          status: UserAccountStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
      });
    });
  });

  // =========================================================================
  // 2. LOGIN & CREDENTIAL VERIFICATION
  // =========================================================================
  describe('2. Login & Credential Verification', () => {
    it('should authenticate User A with valid credentials and return JWT tokens & session', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userAEmail,
          password: initialPassword,
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id', userAId);
      expect(res.body.user).toHaveProperty('email', userAEmail);

      userAToken = res.body.accessToken;
      userARefreshToken = res.body.refreshToken;

      // Verify JWT token format
      const decoded: any = jwt.decode(userAToken);
      expect(decoded).toHaveProperty('sub', userAId);
      expect(decoded).toHaveProperty('email', userAEmail);
      expect(decoded).toHaveProperty('exp');
    });

    it('should authenticate User B', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userBEmail,
          password: initialPassword,
        })
        .expect(200);

      userBToken = res.body.accessToken;
    });

    it('should reject invalid password with generic 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userAEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(res.body).toHaveProperty('statusCode', 401);
      expect(res.body.message).toContain('Invalid');
    });

    it('should reject non-existent user with generic 401 (enumeration defense)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `nonexistent-${timestamp}@example.com`,
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(res.body).toHaveProperty('statusCode', 401);
      expect(res.body.message).toContain('Invalid');
    });
  });

  // =========================================================================
  // 3. IDENTITY & /ME PROFILE ENDPOINT
  // =========================================================================
  describe('3. Identity & /me Boundary', () => {
    it('should return authenticated identity for User A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', userAId);
      expect(res.body).toHaveProperty('email', userAEmail);
    });

    it('should reject unauthenticated /me with 401', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });

    it('should prevent identity substitution through query or header manipulation', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/auth/me?userId=${userBId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .set('X-User-Id', userBId)
        .expect(200);

      // Identity MUST remain User A regardless of headers/query
      expect(res.body.id).toEqual(userAId);
      expect(res.body.id).not.toEqual(userBId);
    });
  });

  // =========================================================================
  // 4. JWT & SESSION BOUNDARY VERIFICATION
  // =========================================================================
  describe('4. JWT Verification & Fail-Closed Boundaries', () => {
    it('should reject malformed token with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer totally-invalid-token-payload')
        .expect(401);
    });

    it('should reject forged token signed with arbitrary key with 401', async () => {
      const forgedToken = jwt.sign(
        { sub: userAId, email: userAEmail },
        'attacker-fake-secret-key-1234567890',
        { expiresIn: '1h' },
      );

      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`)
        .expect(401);
    });

    it('should reject expired token with 401', async () => {
      const expiredToken = jwt.sign(
        { sub: userAId, email: userAEmail },
        process.env.JWT_ACCESS_SECRET || 'test-access-secret',
        { expiresIn: -10 },
      );

      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should reject alg: none attack token with 401', async () => {
      const header = Buffer.from(
        JSON.stringify({ alg: 'none', typ: 'JWT' }),
      ).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({
          sub: userAId,
          email: userAEmail,
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString('base64url');
      const noneToken = `${header}.${payload}.`;

      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${noneToken}`)
        .expect(401);
    });
  });

  // =========================================================================
  // 5. AUTHORIZATION & TENANT / PRIVILEGE BOUNDARIES
  // =========================================================================
  describe('5. Authorization & Privilege Boundaries', () => {
    it('should block non-admin user from accessing Admin endpoints with 401/403', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect((res) => {
          expect([401, 403]).toContain(res.statusCode);
        });
    });

    it('should prevent cross-user resource tampering', async () => {
      // Create a domain owned by User B
      const userBDomain = await prisma.domain.create({
        data: {
          domainName: `domain-b-${timestamp}.com`,
          userId: userBId,
        },
      });

      // User A attempts to delete or access User B domain
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/workspace/domains/${userBDomain.id}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect([401, 403, 404]).toContain(deleteRes.statusCode);

      // Verify domain still exists in DB
      const checkDomain = await prisma.domain.findUnique({
        where: { id: userBDomain.id },
      });
      expect(checkDomain).toBeDefined();

      // Clean up domain
      await prisma.domain.delete({ where: { id: userBDomain.id } });
    });
  });

  // =========================================================================
  // 6. OAUTH REDIRECTION & INTEGRATION
  // =========================================================================
  describe('6. OAuth Providers Handshake', () => {
    it('GET /api/v1/auth/google should issue 302 redirect to Google consent', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/google')
        .expect(302);

      expect(res.headers.location).toContain('accounts.google.com');
    });

    it('GET /api/v1/auth/github should issue 302 redirect to GitHub consent', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/github')
        .expect(302);

      expect(res.headers.location).toContain('github.com/login/oauth');
    });

    it('should link Google OAuth account and list connected providers', async () => {
      // Link Google Account to User A
      await prisma.oAuthAccount.create({
        data: {
          userId: userAId,
          provider: OAuthProvider.GOOGLE,
          providerUserId: `google-sub-${timestamp}`,
          providerEmail: userAEmail,
        },
      });

      const providersRes = await request(app.getHttpServer())
        .get('/api/v1/auth/providers')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(providersRes.body).toHaveProperty('providers');
      const googleProvider = providersRes.body.providers.find(
        (p: any) => p.provider === 'google',
      );
      expect(googleProvider).toBeDefined();
      expect(googleProvider?.connected).toBe(true);
    });
  });

  // =========================================================================
  // 7. PASSWORD SECURITY & CHANGE FLOW
  // =========================================================================
  describe('7. Password Hashing & Change Security', () => {
    it('should verify PasswordHashingService enforces Argon2id', async () => {
      const hash = await PasswordHashingService.hashPassword(initialPassword);
      expect(hash).toMatch(/^\$argon2id\$/);

      const isValid = await PasswordHashingService.verifyPassword(
        hash,
        initialPassword,
      );
      expect(isValid).toBe(true);

      const isInvalid = await PasswordHashingService.verifyPassword(
        hash,
        'wrong',
      );
      expect(isInvalid).toBe(false);

      const posture =
        PasswordHashingService.evaluatePasswordStoragePosture(hash);
      expect(posture.valid).toBe(true);
      expect(posture.decision).toBe('CANONICAL_ARGON2ID_VERIFIED');
    });

    it('should successfully change password and reject old password thereafter', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          currentPassword: initialPassword,
          newPassword: newPassword,
        })
        .expect(200);

      // Verify old password fails
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userAEmail,
          password: initialPassword,
        })
        .expect(401);

      // Verify new password succeeds
      const newLoginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userAEmail,
          password: newPassword,
        })
        .expect(200);

      expect(newLoginRes.body).toHaveProperty('accessToken');
      userAToken = newLoginRes.body.accessToken;
      userARefreshToken = newLoginRes.body.refreshToken;
    });
  });

  // =========================================================================
  // 8. SESSION MANAGEMENT & REVOCATION
  // =========================================================================
  describe('8. Session Management & Revocation', () => {
    it('should list active sessions for User A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should rotate refresh token on /refresh', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ refreshToken: userARefreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.refreshToken).not.toEqual(userARefreshToken);

      // Old refresh token must be invalidated
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ refreshToken: userARefreshToken })
        .expect(401);

      userAToken = res.body.accessToken;
      userARefreshToken = res.body.refreshToken;
    });

    it('should revoke session on /logout', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ refreshToken: userARefreshToken })
        .expect(200);

      // Revoked refresh token cannot be used again
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ refreshToken: userARefreshToken })
        .expect(401);
    });
  });

  // =========================================================================
  // 9. ACCOUNT LIFECYCLE (DEACTIVATION / REACTIVATION)
  // =========================================================================
  describe('9. Account Lifecycle & Deactivation', () => {
    it('should block deactivated user from logging in', async () => {
      // Deactivate User B
      await prisma.user.update({
        where: { id: userBId },
        data: { status: UserAccountStatus.DEACTIVATED },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userBEmail,
          password: initialPassword,
        })
        .expect(401);

      expect(res.body.message).toMatch(/deactivated|invalid/i);
    });

    it('should request reactivation and confirm reactivation with secure token', async () => {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');

      await prisma.accountReactivationToken.create({
        data: {
          userId: userBId,
          tokenHash,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      const reactivateRes = await request(app.getHttpServer())
        .post('/api/v1/auth/reactivate/confirm')
        .send({ token: rawToken })
        .expect(200);

      expect(reactivateRes.body).toHaveProperty('user');
      expect(reactivateRes.body.user).toHaveProperty('id', userBId);
      expect(reactivateRes.body).toHaveProperty('accessToken');

      const userBFromDb = await prisma.user.findUnique({
        where: { id: userBId },
      });
      expect(userBFromDb?.status).toBe(UserAccountStatus.ACTIVE);

      // User B can login again
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userBEmail,
          password: initialPassword,
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty('accessToken');
    });
  });
});
