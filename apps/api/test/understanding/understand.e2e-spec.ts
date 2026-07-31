import { API_PREFIX } from '../common/constants';
import {
  expectApiError,
  expectCorrelationHeaders,
  expectIsoDate,
  expectSecurityHeaders,
  expectUuid,
} from '../common/assertions.helper';
import { authenticatedRequest, getAccessToken } from '../common/auth.helper';
import { createDomainDto } from '../common/factories.helper';
import {
  closeTestApp,
  createTestApp,
  TestAppInstance,
} from '../common/test-app.helper';

describe('POST /api/v1/domains/:domainId/understand (Understanding Engine Regression Suite)', () => {
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

  describe('Success Scenarios (202 Accepted)', () => {
    it('should queue domain understanding analysis and return 202 Accepted with Location header', async () => {
      const domainDto = createDomainDto();

      const domainRes = await authenticatedRequest(testApp, userAToken)
        .post(`${API_PREFIX}/domains`)
        .send(domainDto)
        .expect(201);

      const domainId = domainRes.body.id;

      const response = await authenticatedRequest(testApp, userAToken)
        .post(`${API_PREFIX}/domains/${domainId}/understand`)
        .expect(202);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.headers).toHaveProperty('location');
      expect(response.headers.location).toMatch(
        new RegExp(`${API_PREFIX}/jobs/.+`),
      );

      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          domainId,
          status: expect.any(String),
        }),
      );

      expectUuid(response.body.id);
      if (response.body.createdAt) {
        expectIsoDate(response.body.createdAt);
      }
    });
  });

  describe('Authentication Scenarios (401 Unauthorized)', () => {
    it('should return 401 Unauthorized when triggering analysis without Bearer token', async () => {
      const response = await testApp.request.post(
        `${API_PREFIX}/domains/3d91d72d-0000-0000-0000-000000000000/understand`,
      );

      expectApiError(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('Domain Not Found Scenarios (404 Not Found)', () => {
    it('should return 404 Not Found when target domain UUID does not exist', async () => {
      const nonExistentDomainId = '3d91d72d-0000-0000-0000-000000000000';

      const response = await authenticatedRequest(testApp, userAToken).post(
        `${API_PREFIX}/domains/${nonExistentDomainId}/understand`,
      );

      expectApiError(response, 404, 'NOT_FOUND');
    });
  });

  describe('Cross-Tenant Isolation & Resource Concealment (404 Not Found)', () => {
    it('should return 404 Not Found when User B attempts to trigger understanding for User A domain', async () => {
      const domainDto = createDomainDto();

      // User A creates domain
      const domainRes = await authenticatedRequest(testApp, userAToken)
        .post(`${API_PREFIX}/domains`)
        .send(domainDto)
        .expect(201);

      const domainId = domainRes.body.id;

      // User B attempts to trigger understanding on User A's domain -> Should return 404
      const response = await authenticatedRequest(testApp, userBToken).post(
        `${API_PREFIX}/domains/${domainId}/understand`,
      );

      expectApiError(response, 404, 'NOT_FOUND');
    });
  });

  describe('Concurrent Request Conflict (409 Conflict)', () => {
    it('should return 409 Conflict when an active understanding job is already in progress for domain', async () => {
      const domainDto = createDomainDto();

      const domainRes = await authenticatedRequest(testApp, userAToken)
        .post(`${API_PREFIX}/domains`)
        .send(domainDto)
        .expect(201);

      const domainId = domainRes.body.id;

      // Trigger first job -> 202 Accepted
      await authenticatedRequest(testApp, userAToken)
        .post(`${API_PREFIX}/domains/${domainId}/understand`)
        .expect(202);

      // Trigger concurrent second job -> 409 Conflict
      const response = await authenticatedRequest(testApp, userAToken).post(
        `${API_PREFIX}/domains/${domainId}/understand`,
      );

      expectApiError(response, 409, 'CONFLICT');
      expect(response.body.message).toMatch(/already in progress/i);
    });
  });
});
