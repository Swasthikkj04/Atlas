import { API_PREFIX } from '../common/constants';
import {
  expectApiError,
  expectCorrelationHeaders,
  expectSecurityHeaders,
  expectUuid,
} from '../common/assertions.helper';
import {
  authenticatedRequest,
  getAccessToken,
} from '../common/auth.helper';
import { createUserDto } from '../common/factories.helper';
import {
  closeTestApp,
  createTestApp,
  TestAppInstance,
} from '../common/test-app.helper';

describe('GET /api/v1/auth/me (Supertest Regression Suite)', () => {
  let testApp: TestAppInstance;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('Authenticated Scenarios (200 OK)', () => {
    it('should return profile details of current user when valid JWT token is provided', async () => {
      const userDto = createUserDto();
      const { accessToken } = await getAccessToken(testApp, userDto);

      const response = await authenticatedRequest(testApp, accessToken)
        .get(`${API_PREFIX}/auth/me`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          email: userDto.email,
        }),
      );

      expectUuid(response.body.id);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
    });
  });

  describe('Unauthenticated / Unauthorized Scenarios (401 Unauthorized)', () => {
    it('should return 401 Unauthorized when Authorization header is missing', async () => {
      const response = await testApp.request.get(`${API_PREFIX}/auth/me`);

      expectApiError(response, 401, 'UNAUTHORIZED');
      expect(response.body.message).toMatch(/unauthorized/i);
    });

    it('should return 401 Unauthorized when Bearer token is invalid or malformed', async () => {
      const response = await testApp.request
        .get(`${API_PREFIX}/auth/me`)
        .set('Authorization', 'Bearer invalid.malformed.jwttoken');

      expectApiError(response, 401, 'UNAUTHORIZED');
    });
  });
});
