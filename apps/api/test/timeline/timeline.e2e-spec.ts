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

describe('GET /api/v1/timeline & GET /api/v1/timeline/:id/details (Product Experience Timeline Suite)', () => {
  let testApp: TestAppInstance;
  let userToken: string;
  let userBToken: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    const userA = await getAccessToken(testApp);
    const userB = await getAccessToken(testApp);
    userToken = userA.accessToken;
    userBToken = userB.accessToken;
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('1. GET /api/v1/timeline Event Feed', () => {
    it('should return infrastructure timeline change feed for authenticated user', async () => {
      const response = await authenticatedRequest(testApp, userToken)
        .get(`${API_PREFIX}/timeline`)
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

    it('should support severity and query filter parameters', async () => {
      const response = await authenticatedRequest(testApp, userToken)
        .get(`${API_PREFIX}/timeline?limit=10&severity=HIGH`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);
    });

    it('should return 401 Unauthorized when querying timeline without Bearer token', async () => {
      const response = await testApp.request.get(`${API_PREFIX}/timeline`);

      expectApiError(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('2. GET /api/v1/timeline/:id/details Event Details', () => {
    it('should return 401 Unauthorized when requesting timeline event details without Bearer token', async () => {
      const response = await testApp.request.get(
        `${API_PREFIX}/timeline/evt-nonexistent-123/details`,
      );

      expectApiError(response, 401, 'UNAUTHORIZED');
    });

    it('should return 404 Not Found when timeline event ID does not exist', async () => {
      const nonExistentEventId = 'evt-nonexistent-123';

      const response = await authenticatedRequest(testApp, userToken)
        .get(`${API_PREFIX}/timeline/${nonExistentEventId}/details`);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);
      expectApiError(response, 404, 'NOT_FOUND');
    });

    it('should return 404 Not Found when User B attempts to access User A timeline event (Cross-Tenant Isolation)', async () => {
      const nonExistentEventId = 'evt-user-a-123';

      const response = await authenticatedRequest(testApp, userBToken)
        .get(`${API_PREFIX}/timeline/${nonExistentEventId}/details`);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);
      expectApiError(response, 404, 'NOT_FOUND');
    });
  });
});
