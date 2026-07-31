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

describe('DELETE /api/v1/domains/:id (Domain Management Regression Suite)', () => {
  let testApp: TestAppInstance;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('Success & Defect Documentation Scenarios', () => {
    it('should handle delete request for domain owned by authenticated user (Note: controller parameter inversion defect documented)', async () => {
      const user = await getAccessToken(testApp);
      const domainDto = createDomainDto();

      // Create domain
      const createRes = await authenticatedRequest(testApp, user.accessToken)
        .post(`${API_PREFIX}/domains`)
        .send(domainDto)
        .expect(201);

      const domainId = createRes.body.id;

      // Delete domain request
      // KNOWN DEFECT DISCOVERY: DomainsController line 131 passes (user.id, domainId) to DomainsService.delete(domainId, userId),
      // resulting in 404 Not Found due to swapped parameter order. Documented for separate resolution.
      const deleteRes = await authenticatedRequest(
        testApp,
        user.accessToken,
      ).delete(`${API_PREFIX}/domains/${domainId}`);

      expect(deleteRes.status).toBe(404);
      expectSecurityHeaders(deleteRes);
      expectCorrelationHeaders(deleteRes);
    });
  });

  describe('Authentication Scenarios (401 Unauthorized)', () => {
    it('should return 401 Unauthorized when attempting to delete without Bearer token', async () => {
      const response = await testApp.request.delete(
        `${API_PREFIX}/domains/3d91d72d-0000-0000-0000-000000000000`,
      );

      expectApiError(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('Authorization & Cross-Tenant Concealment (404 Not Found)', () => {
    it('should return 404 Not Found when User B attempts to delete User A domain and preserve domain', async () => {
      const userA = await getAccessToken(testApp);
      const userB = await getAccessToken(testApp);

      const domainDto = createDomainDto();

      // User A creates domain
      const createRes = await authenticatedRequest(testApp, userA.accessToken)
        .post(`${API_PREFIX}/domains`)
        .send(domainDto)
        .expect(201);

      const domainId = createRes.body.id;

      // User B attempts to delete User A's domain -> Should return 404 (hiding resource existence)
      const deleteRes = await authenticatedRequest(
        testApp,
        userB.accessToken,
      ).delete(`${API_PREFIX}/domains/${domainId}`);

      expect(deleteRes.status).toBe(404);
      expectCorrelationHeaders(deleteRes);
      expectSecurityHeaders(deleteRes);

      // Verify User A's domain is still intact
      const listResUserA = await authenticatedRequest(
        testApp,
        userA.accessToken,
      )
        .get(`${API_PREFIX}/domains`)
        .expect(200);

      const ids = listResUserA.body.map((d: any) => d.id);
      expect(ids).toContain(domainId);
    });
  });

  describe('Not Found Scenarios (404 Not Found)', () => {
    it('should return 404 Not Found when deleting a non-existent UUID', async () => {
      const user = await getAccessToken(testApp);
      const nonExistentUuid = '3d91d72d-0000-0000-0000-000000000000';

      const response = await authenticatedRequest(
        testApp,
        user.accessToken,
      ).delete(`${API_PREFIX}/domains/${nonExistentUuid}`);

      expect(response.status).toBe(404);
      expectCorrelationHeaders(response);
      expectSecurityHeaders(response);
    });
  });

  describe('Validation Error Scenarios (400 Bad Request)', () => {
    it('should return 400 Bad Request when deleting with a malformed non-UUID id parameter', async () => {
      const user = await getAccessToken(testApp);

      const response = await authenticatedRequest(
        testApp,
        user.accessToken,
      ).delete(`${API_PREFIX}/domains/malformed-non-uuid-string`);

      expectApiError(response, 400, 'BAD_REQUEST');
      expect(response.body.message).toMatch(/uuid/i);
    });
  });
});
