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

describe('GET /api/v1/explorer & GET /api/v1/explorer/:assetId (Product Experience Explorer Suite)', () => {
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

  describe('1. GET /api/v1/explorer Inventory Feed', () => {
    it('should return asset inventory feed with pagination for authenticated user', async () => {
      const response = await authenticatedRequest(testApp, userToken)
        .get(`${API_PREFIX}/explorer`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.body).toEqual(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.objectContaining({
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number),
          }),
        }),
      );
    });

    it('should support search and pagination query parameters', async () => {
      const response = await authenticatedRequest(testApp, userToken)
        .get(`${API_PREFIX}/explorer?page=1&limit=10&search=google`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.body.pagination).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 10,
        }),
      );
    });

    it('should return 401 Unauthorized when querying explorer feed without Bearer token', async () => {
      const response = await testApp.request.get(`${API_PREFIX}/explorer`);

      expectApiError(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('2. GET /api/v1/explorer/:assetId Asset Details', () => {
    it('should return 401 Unauthorized when requesting asset detail without Bearer token', async () => {
      const response = await testApp.request.get(
        `${API_PREFIX}/explorer/ast-nonexistent-123`,
      );

      expectApiError(response, 401, 'UNAUTHORIZED');
    });

    it('should return 404 Not Found when asset ID does not exist', async () => {
      const nonExistentAssetId = 'ast-nonexistent-123';

      const response = await authenticatedRequest(testApp, userToken)
        .get(`${API_PREFIX}/explorer/${nonExistentAssetId}`);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);
      expectApiError(response, 404, 'NOT_FOUND');
    });

    it('should return 404 Not Found when User B attempts to access User A asset (Cross-Tenant Isolation)', async () => {
      const nonExistentAssetId = 'ast-user-a-123';

      const response = await authenticatedRequest(testApp, userBToken)
        .get(`${API_PREFIX}/explorer/${nonExistentAssetId}`);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);
      expectApiError(response, 404, 'NOT_FOUND');
    });
  });
});
