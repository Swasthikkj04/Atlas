import { API_PREFIX } from '../common/constants';
import {
  expectApiError,
  expectCorrelationHeaders,
  expectIsoDate,
  expectSecurityHeaders,
  expectUuid,
} from '../common/assertions.helper';
import {
  createUserDto,
  randomEmail,
} from '../common/factories.helper';
import {
  closeTestApp,
  createTestApp,
  TestAppInstance,
} from '../common/test-app.helper';
import { registerTestUser } from '../common/auth.helper';

describe('POST /api/v1/auth/login (Supertest Regression Suite)', () => {
  let testApp: TestAppInstance;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('Success Scenarios (Authentication Success)', () => {
    it('should successfully authenticate user and return JWT access token and user metadata', async () => {
      const userDto = createUserDto();
      await registerTestUser(testApp, userDto);

      const response = await testApp.request
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: userDto.email,
          password: userDto.password,
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(300);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.body).toEqual(
        expect.objectContaining({
          accessToken: expect.any(String),
          user: expect.objectContaining({
            id: expect.any(String),
            email: userDto.email,
            fullName: userDto.fullName,
          }),
        }),
      );

      expectUuid(response.body.user.id);
      if (response.body.user.createdAt) {
        expectIsoDate(response.body.user.createdAt);
      }
    });
  });

  describe('Invalid Credentials Scenarios (401 Unauthorized)', () => {
    it('should return 401 Unauthorized when password is incorrect', async () => {
      const userDto = createUserDto();
      await registerTestUser(testApp, userDto);

      const response = await testApp.request
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: userDto.email,
          password: 'WrongPassword999!',
        });

      expectApiError(response, 401, 'UNAUTHORIZED');
      expect(response.body.message).toMatch(/invalid/i);
    });

    it('should return 401 Unauthorized when email does not exist', async () => {
      const response = await testApp.request
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: randomEmail('unknown'),
          password: 'SomePassword123!',
        });

      expectApiError(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('Validation Error Scenarios (400 Bad Request)', () => {
    it('should return 400 Bad Request when email format is invalid', async () => {
      const response = await testApp.request
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: 'invalid-email-format',
          password: 'Password123!',
        });

      expectApiError(response, 400, 'BAD_REQUEST');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 Bad Request when password field is missing', async () => {
      const response = await testApp.request
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: randomEmail('nopass'),
        });

      expectApiError(response, 400, 'BAD_REQUEST');
    });
  });

  describe('Rate Limiting Scenarios (429 Too Many Requests)', () => {
    it('should enforce rate limiting after exceeding login attempt threshold', async () => {
      const targetEmail = randomEmail('ratelimit');
      let response;

      for (let i = 0; i < 15; i++) {
        response = await testApp.request
          .post(`${API_PREFIX}/auth/login`)
          .send({ email: targetEmail, password: 'WrongPassword!' });
        if (response.status === 429) {
          break;
        }
      }

      expectApiError(response, 429, 'RATE_LIMIT_EXCEEDED');
    });
  });
});
