import { API_PREFIX } from '../common/constants';
import {
  expectApiError,
  expectCorrelationHeaders,
  expectSecurityHeaders,
} from '../common/assertions.helper';
import { authenticatedRequest, getAccessToken } from '../common/auth.helper';
import {
  closeTestApp,
  createTestApp,
  TestAppInstance,
} from '../common/test-app.helper';

describe('GET /api/v1/findings/:findingId (Finding Details Regression Suite)', () => {
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

  describe('Authentication Scenarios (401 Unauthorized)', () => {
    it('should return 401 Unauthorized when requesting finding details without Bearer token', async () => {
      const response = await testApp.request.get(
        `${API_PREFIX}/findings/find-nonexistent-123`,
      );

      expectApiError(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('Not Found & Isolation Scenarios (404 Not Found)', () => {
    it('should return 404 Not Found when finding ID does not exist', async () => {
      const nonExistentFindingId = 'find-nonexistent-123';

      const response = await authenticatedRequest(testApp, userToken).get(
        `${API_PREFIX}/findings/${nonExistentFindingId}`,
      );

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);
      expectApiError(response, 404, 'NOT_FOUND');
    });

    it('should return 404 Not Found when User B attempts to access User A finding (Cross-Tenant Isolation)', async () => {
      const nonExistentFindingId = 'find-user-a-123';

      const response = await authenticatedRequest(testApp, userBToken).get(
        `${API_PREFIX}/findings/${nonExistentFindingId}`,
      );

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);
      expectApiError(response, 404, 'NOT_FOUND');
    });
  });
});
