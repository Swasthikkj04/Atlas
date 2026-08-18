import { API_PREFIX } from '../common/constants';
import {
  expectApiError,
  expectCorrelationHeaders,
  expectIsoDate,
  expectSecurityHeaders,
  expectUuid,
} from '../common/assertions.helper';
import { createUserDto } from '../common/factories.helper';
import {
  closeTestApp,
  createTestApp,
  TestAppInstance,
} from '../common/test-app.helper';

describe('POST /api/v1/auth/register (Supertest Regression Suite)', () => {
  let testApp: TestAppInstance;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('1. Success Scenarios (201 Created)', () => {
    it('should successfully register a new user and return sanitized RegisterResponseDto', async () => {
      const userDto = createUserDto();

      const response = await testApp.request
        .post(`${API_PREFIX}/auth/register`)
        .set('X-Forwarded-For', '10.0.1.101')
        .send(userDto)
        .expect(201);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.any(String),
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

      // Sensitive fields assertion: Ensure password or passwordHash are NEVER exposed
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.user).not.toHaveProperty('hash');
      expect(response.body.user).not.toHaveProperty('accessToken');
    });
  });

  describe('2. Conflict Error Scenarios (409 Conflict)', () => {
    it('should return 409 Conflict when attempting to register a duplicate email', async () => {
      const userDto = createUserDto();

      // First registration -> 201 Created
      await testApp.request
        .post(`${API_PREFIX}/auth/register`)
        .set('X-Forwarded-For', '10.0.1.102')
        .send(userDto)
        .expect(201);

      // Second registration with identical email -> 409 Conflict
      const response = await testApp.request
        .post(`${API_PREFIX}/auth/register`)
        .set('X-Forwarded-For', '10.0.1.102')
        .send(userDto);

      expectApiError(response, 409, 'CONFLICT');
      expect(response.body.message).toMatch(/already registered/i);
    });
  });

  describe('3. Validation Error Scenarios (400 Bad Request)', () => {
    it('should return 400 Bad Request when email format is invalid', async () => {
      const invalidDto = createUserDto({ email: 'not-an-email-address' });

      const response = await testApp.request
        .post(`${API_PREFIX}/auth/register`)
        .set('X-Forwarded-For', '10.0.1.103')
        .send(invalidDto);

      expectApiError(response, 400, 'BAD_REQUEST');
      expect(response.body.details).toEqual(
        expect.arrayContaining([expect.stringMatching(/email/i)]),
      );
    });

    it('should return 400 Bad Request when password is weak or shorter than 8 characters', async () => {
      const invalidDto = createUserDto({
        password: 'short',
        confirmPassword: 'short',
      });

      const response = await testApp.request
        .post(`${API_PREFIX}/auth/register`)
        .set('X-Forwarded-For', '10.0.1.104')
        .send(invalidDto);

      expectApiError(response, 400, 'BAD_REQUEST');
      expect(response.body.details).toEqual(
        expect.arrayContaining([expect.stringMatching(/password/i)]),
      );
    });

    it('should return 400 Bad Request when confirmPassword does not match password', async () => {
      const invalidDto = createUserDto({
        password: 'SuperSecurePassword123!',
        confirmPassword: 'DifferentPassword456!',
      });

      const response = await testApp.request
        .post(`${API_PREFIX}/auth/register`)
        .set('X-Forwarded-For', '10.0.1.105')
        .send(invalidDto);

      expectApiError(response, 400, 'BAD_REQUEST');
      expect(response.body.message).toMatch(/passwords do not match/i);
    });

    it('should return 400 Bad Request when confirmPassword is missing', async () => {
      const { confirmPassword, ...withoutConfirm } = createUserDto();

      const response = await testApp.request
        .post(`${API_PREFIX}/auth/register`)
        .set('X-Forwarded-For', '10.0.1.106')
        .send(withoutConfirm);

      expectApiError(response, 400, 'BAD_REQUEST');
    });
  });

  describe('4. Rate Limiting Scenarios (429 Too Many Requests)', () => {
    it('should enforce rate limiting after exceeding register request threshold', async () => {
      let response;
      for (let i = 0; i < 10; i++) {
        response = await testApp.request
          .post(`${API_PREFIX}/auth/register`)
          .set('X-Forwarded-For', '10.0.1.199')
          .send(createUserDto());
        if (response.status === 429) {
          break;
        }
      }

      expectApiError(response, 429, 'RATE_LIMIT_EXCEEDED');
      expect(response.body.message).toMatch(/limit/i);
    });
  });
});
