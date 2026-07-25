import { API_PREFIX } from '../common/constants';
import {
  expectApiError,
  expectCorrelationHeaders,
  expectSecurityHeaders,
} from '../common/assertions.helper';
import {
  authenticatedRequest,
  getAccessToken,
} from '../common/auth.helper';
import {
  closeTestApp,
  createTestApp,
  TestAppInstance,
} from '../common/test-app.helper';

describe('GET /api/v1/activity (Product Experience Activity Suite)', () => {
  let testApp: TestAppInstance;
  let userToken: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    const user = await getAccessToken(testApp);
    userToken = user.accessToken;
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('GET /api/v1/activity Activity Feed', () => {
    it('should return workspace activity feed with cursor pagination for authenticated user', async () => {
      const response = await authenticatedRequest(testApp, userToken)
        .get(`${API_PREFIX}/activity`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.body).toEqual(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object),
        }),
      );
    });

    it('should support limit query parameter', async () => {
      const response = await authenticatedRequest(testApp, userToken)
        .get(`${API_PREFIX}/activity?limit=10`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.body.pagination).toEqual(
        expect.objectContaining({
          limit: 10,
        }),
      );
    });

    it('should return 401 Unauthorized when querying activity feed without Bearer token', async () => {
      const response = await testApp.request.get(`${API_PREFIX}/activity`);

      expectApiError(response, 401, 'UNAUTHORIZED');
    });
  });
});
