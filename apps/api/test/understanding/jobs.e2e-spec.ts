import { API_PREFIX } from '../common/constants';
import {
  expectApiError,
  expectCorrelationHeaders,
  expectIsoDate,
  expectSecurityHeaders,
  expectUuid,
} from '../common/assertions.helper';
import {
  authenticatedRequest,
  getAccessToken,
} from '../common/auth.helper';
import { createDomainDto } from '../common/factories.helper';
import {
  closeTestApp,
  createTestApp,
  TestAppInstance,
} from '../common/test-app.helper';

describe('GET /api/v1/jobs/:jobId & GET /api/v1/domains/:domainId/jobs (Understanding Engine Regression Suite)', () => {
  let testApp: TestAppInstance;
  let userAToken: string;
  let userBToken: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    const userA = await getAccessToken(testApp);
    const userB = await getAccessToken(testApp);
    userAToken = userA.accessToken;
    userBToken = userB.accessToken;
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('1. GET /api/v1/jobs/:jobId Success & Details (200 OK)', () => {
    it('should return job details and status for a valid jobId owned by authenticated user', async () => {
      const domainDto = createDomainDto();

      // Create domain
      const domainRes = await authenticatedRequest(testApp, userAToken)
        .post(`${API_PREFIX}/domains`)
        .send(domainDto)
        .expect(201);

      const domainId = domainRes.body.id;

      // Trigger job
      const understandRes = await authenticatedRequest(testApp, userAToken)
        .post(`${API_PREFIX}/domains/${domainId}/understand`)
        .expect(202);

      const jobId = understandRes.body.id;

      // Fetch job status
      const response = await authenticatedRequest(testApp, userAToken)
        .get(`${API_PREFIX}/jobs/${jobId}`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: jobId,
          domainId,
          status: expect.any(String),
          trigger: expect.any(String),
        }),
      );

      expectUuid(response.body.id);
      if (response.body.createdAt) {
        expectIsoDate(response.body.createdAt);
      }
    });
  });

  describe('2. GET /api/v1/jobs/:jobId Error & Security Scenarios', () => {
    it('should return 401 Unauthorized when querying job details without Bearer token', async () => {
      const response = await testApp.request.get(
        `${API_PREFIX}/jobs/3d91d72d-0000-0000-0000-000000000000`,
      );

      expectApiError(response, 401, 'UNAUTHORIZED');
    });

    it('should return 404 Not Found when jobId does not exist', async () => {
      const nonExistentJobId = '3d91d72d-0000-0000-0000-000000000000';

      const response = await authenticatedRequest(testApp, userAToken)
        .get(`${API_PREFIX}/jobs/${nonExistentJobId}`);

      expectApiError(response, 404, 'NOT_FOUND');
    });

    it('should return 404 Not Found when User B attempts to access User A job (Cross-Tenant Isolation)', async () => {
      const domainRes = await authenticatedRequest(testApp, userAToken)
        .post(`${API_PREFIX}/domains`)
        .send(createDomainDto())
        .expect(201);

      const domainId = domainRes.body.id;

      const understandRes = await authenticatedRequest(testApp, userAToken)
        .post(`${API_PREFIX}/domains/${domainId}/understand`)
        .expect(202);

      const jobIdUserA = understandRes.body.id;

      // User B attempts to view User A's job details -> Should return 404
      const response = await authenticatedRequest(testApp, userBToken)
        .get(`${API_PREFIX}/jobs/${jobIdUserA}`);

      expectApiError(response, 404, 'NOT_FOUND');
      expect(response.body).not.toHaveProperty('domainId');
    });
  });

  describe('3. GET /api/v1/domains/:domainId/jobs Collection Scenarios', () => {
    it('should return empty array [] for a domain with no historical understanding jobs', async () => {
      const domainRes = await authenticatedRequest(testApp, userAToken)
        .post(`${API_PREFIX}/domains`)
        .send(createDomainDto())
        .expect(201);

      const domainId = domainRes.body.id;

      const response = await authenticatedRequest(testApp, userAToken)
        .get(`${API_PREFIX}/domains/${domainId}/jobs`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return array of understanding jobs created for target domain', async () => {
      const domainRes = await authenticatedRequest(testApp, userAToken)
        .post(`${API_PREFIX}/domains`)
        .send(createDomainDto())
        .expect(201);

      const domainId = domainRes.body.id;

      await authenticatedRequest(testApp, userAToken)
        .post(`${API_PREFIX}/domains/${domainId}/understand`)
        .expect(202);

      const response = await authenticatedRequest(testApp, userAToken)
        .get(`${API_PREFIX}/domains/${domainId}/jobs`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);

      for (const job of response.body) {
        expectUuid(job.id);
        expect(job.domainId).toBe(domainId);
      }
    });

    it('should return 401 Unauthorized when listing domain jobs without Bearer token', async () => {
      const response = await testApp.request.get(
        `${API_PREFIX}/domains/3d91d72d-0000-0000-0000-000000000000/jobs`,
      );

      expectApiError(response, 401, 'UNAUTHORIZED');
    });

    it('should return 404 Not Found when User B attempts to access User A domain jobs (Cross-Tenant Isolation)', async () => {
      const domainRes = await authenticatedRequest(testApp, userAToken)
        .post(`${API_PREFIX}/domains`)
        .send(createDomainDto())
        .expect(201);

      const domainIdUserA = domainRes.body.id;

      await authenticatedRequest(testApp, userAToken)
        .post(`${API_PREFIX}/domains/${domainIdUserA}/understand`)
        .expect(202);

      // User B attempts to list jobs for User A's domain -> Should return 404
      const response = await authenticatedRequest(testApp, userBToken)
        .get(`${API_PREFIX}/domains/${domainIdUserA}/jobs`);

      expectApiError(response, 404, 'NOT_FOUND');
    });
  });
});
