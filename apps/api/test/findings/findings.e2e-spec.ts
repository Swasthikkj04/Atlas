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

describe('GET /api/v1/findings & GET /api/v1/findings/snapshots/:snapshotId/findings (Infrastructure Findings Regression Suite)', () => {
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

  describe('1. GET /api/v1/findings Collection & Experience Scenarios', () => {
    it('should return paginated findings list experience for authenticated user', async () => {
      const response = await authenticatedRequest(testApp, userToken)
        .get(`${API_PREFIX}/findings`)
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
            pages: expect.any(Number),
          }),
        }),
      );
    });

    it('should support severity and category filter parameters', async () => {
      const response = await authenticatedRequest(testApp, userToken)
        .get(`${API_PREFIX}/findings?severity=HIGH&page=1&limit=10`)
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

    it('should return 401 Unauthorized when querying findings experience without Bearer token', async () => {
      const response = await testApp.request.get(`${API_PREFIX}/findings`);

      expectApiError(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('2. GET /api/v1/findings/snapshots/:snapshotId/findings Snapshot Scenarios', () => {
    it('should return paginated findings list for target snapshot ID', async () => {
      const snapshotId = '3d91d72d-0000-0000-0000-000000000000';

      const response = await authenticatedRequest(testApp, userToken)
        .get(`${API_PREFIX}/findings/snapshots/${snapshotId}/findings`)
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

    it('should return 401 Unauthorized when querying snapshot findings without Bearer token', async () => {
      const response = await testApp.request.get(
        `${API_PREFIX}/findings/snapshots/3d91d72d-0000-0000-0000-000000000000/findings`,
      );

      expectApiError(response, 401, 'UNAUTHORIZED');
    });
  });
});
