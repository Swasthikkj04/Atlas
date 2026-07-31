import { API_PREFIX } from '../common/constants';
import {
  expectApiError,
  expectCorrelationHeaders,
  expectSecurityHeaders,
} from '../common/assertions.helper';
import { authenticatedRequest, getAccessToken } from '../common/auth.helper';
import { createDomainDto } from '../common/factories.helper';
import {
  closeTestApp,
  createTestApp,
  TestAppInstance,
} from '../common/test-app.helper';

describe('GET /api/v1/domains/:domainId/snapshots (Infrastructure Snapshots Regression Suite)', () => {
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

  describe('Success & Collection Scenarios (200 OK)', () => {
    it('should return empty paginated snapshot list for a domain with no snapshots', async () => {
      const domainRes = await authenticatedRequest(testApp, userToken)
        .post(`${API_PREFIX}/domains`)
        .send(createDomainDto())
        .expect(201);

      const domainId = domainRes.body.id;

      const response = await authenticatedRequest(testApp, userToken)
        .get(`${API_PREFIX}/domains/${domainId}/snapshots`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.body).toEqual(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.objectContaining({
            page: 1,
            limit: 20,
            total: 0,
          }),
        }),
      );
      expect(response.body.data.length).toBe(0);
    });

    it('should support pagination query parameters page and limit', async () => {
      const domainRes = await authenticatedRequest(testApp, userToken)
        .post(`${API_PREFIX}/domains`)
        .send(createDomainDto())
        .expect(201);

      const domainId = domainRes.body.id;

      const response = await authenticatedRequest(testApp, userToken)
        .get(`${API_PREFIX}/domains/${domainId}/snapshots?page=2&limit=5`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.body.pagination).toEqual(
        expect.objectContaining({
          page: 2,
          limit: 5,
        }),
      );
    });
  });

  describe('Authentication Scenarios (401 Unauthorized)', () => {
    it('should return 401 Unauthorized when querying domain snapshots without Bearer token', async () => {
      const response = await testApp.request.get(
        `${API_PREFIX}/domains/3d91d72d-0000-0000-0000-000000000000/snapshots`,
      );

      expectApiError(response, 401, 'UNAUTHORIZED');
    });
  });
});
