import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { GoogleAuthService } from '../../src/modules/auth/services/google-auth.service';
import { GitHubAuthService } from '../../src/modules/auth/services/github-auth.service';
import { UnderstandingEngine } from '../../src/modules/understanding/understanding.engine';
import { OAuthProvider, UserAccountStatus, TriggerType } from '@prisma/client';

describe('OAuth Authentication & Guest Session Claim Flow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let googleAuthService: GoogleAuthService;
  let githubAuthService: GitHubAuthService;

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
    googleAuthService = app.get(GoogleAuthService);
    githubAuthService = app.get(GitHubAuthService);

    jest.spyOn(UnderstandingEngine.prototype, 'execute').mockResolvedValue(undefined as any);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. OAuth Initiation Redirect Endpoints', () => {
    it('GET /api/v1/auth/google should initiate OAuth handshake with 302 redirect to accounts.google.com', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/google')
        .expect(302);

      expect(response.headers.location).toBeDefined();
      expect(response.headers.location).toContain('accounts.google.com');
    });

    it('GET /api/v1/auth/github should initiate OAuth handshake with 302 redirect to github.com/login/oauth', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/github')
        .expect(302);

      expect(response.headers.location).toBeDefined();
      expect(response.headers.location).toContain('github.com/login/oauth/authorize');
    });
  });

  describe('2. Google OAuth: New User -> Authenticated Session -> Guest Claim', () => {
    it('provisions new user, creates session cookies, and claims guest session', async () => {
      // 1. Setup Guest Understanding via real endpoint
      const domainName = `google-guest-claim-${Date.now()}.com`;
      const guestRes = await request(app.getHttpServer())
        .post('/api/v1/guest/understand')
        .send({ domain: domainName })
        .expect(202);

      const rawToken = guestRes.body.sessionId;
      const jobId = guestRes.body.jobId;

      // 2. Simulate Google OAuth Resolution (Case D: New User)
      const googleSub = `google_sub_${Date.now()}`;
      const googleEmail = `new-google-user-${Date.now()}@gmail.com`;
      const googleFullName = 'Google Explorer';

      const authResult = await googleAuthService.resolveAndAuthenticateGoogleUser(
        {
          googleId: googleSub,
          email: googleEmail,
          fullName: googleFullName,
          avatarUrl: 'https://lh3.googleusercontent.com/avatar.jpg',
        },
        {
          browser: 'Chrome',
          operatingSystem: 'Linux',
          deviceType: 'Desktop',
          deviceName: 'Chrome on Linux',
        },
      );

      expect(authResult.accessToken).toBeDefined();
      expect(authResult.user.email).toBe(googleEmail);
      expect(authResult.event).toBe('GOOGLE_ACCOUNT_CREATED');

      // 3. User checks authenticated profile with token
      const meResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authResult.accessToken}`)
        .expect(200);

      expect(meResponse.body.email).toBe(googleEmail);
      expect(meResponse.body.fullName).toBe(googleFullName);

      // 4. User claims guest session via POST /api/v1/guest/claim
      const claimResponse = await request(app.getHttpServer())
        .post('/api/v1/guest/claim')
        .set('Authorization', `Bearer ${authResult.accessToken}`)
        .send({ sessionToken: rawToken })
        .expect(200);

      expect(claimResponse.body.success).toBe(true);
      expect(claimResponse.body.domainName).toBe(domainName);
      expect(claimResponse.body.jobId).toBe(jobId);

      // 5. Verify Domain ownership reassigned in DB
      const claimedDomain = await prisma.domain.findFirst({
        where: { domainName, userId: authResult.user.id },
      });
      expect(claimedDomain).toBeDefined();
      expect(claimedDomain?.userId).toBe(authResult.user.id);
    });
  });

  describe('3. GitHub OAuth: Existing User Account Linking (No Duplication)', () => {
    it('links GitHub account to existing user without creating duplicate user', async () => {
      // 1. Create existing user with local credentials
      const localEmail = `github-link-${Date.now()}@example.com`;
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: localEmail,
          password: 'Password123!',
          confirmPassword: 'Password123!',
          fullName: 'Local Developer',
        })
        .expect(201);

      const existingUserId = registerRes.body.user.id;

      // 2. Simulate GitHub OAuth resolution with same email (Case C: Upgrades & Links)
      const githubId = `gh_${Date.now()}`;
      const authResult = await githubAuthService.resolveAndAuthenticateGitHubUser(
        {
          githubId,
          email: localEmail,
          emailVerified: true,
          fullName: 'Local Developer',
          avatarUrl: 'https://avatars.githubusercontent.com/u/12345',
        },
        {
          browser: 'Firefox',
          operatingSystem: 'Linux',
          deviceType: 'Desktop',
          deviceName: 'Firefox on Linux',
        },
      );

      // Verify same User ID is reused
      expect(authResult.user.id).toBe(existingUserId);
      expect(authResult.event).toBe('GITHUB_ACCOUNT_LINKED');

      // Verify OAuthAccount relation was created
      const oauthAccount = await prisma.oAuthAccount.findUnique({
        where: {
          provider_providerUserId: {
            provider: OAuthProvider.GITHUB,
            providerUserId: githubId,
          },
        },
      });
      expect(oauthAccount).toBeDefined();
      expect(oauthAccount?.userId).toBe(existingUserId);

      // Verify user status upgraded to ACTIVE
      const updatedUser = await prisma.user.findUnique({
        where: { id: existingUserId },
      });
      expect(updatedUser?.status).toBe(UserAccountStatus.ACTIVE);
    });
  });
});
