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

describe('GET /api/v1/domains (Domain Management Regression Suite)', () => {
  let testApp: TestAppInstance;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('Success & Collection Scenarios (200 OK)', () => {
    it('should return empty array [] for a newly registered user with zero domains', async () => {
      const { accessToken } = await getAccessToken(testApp);

      const response = await authenticatedRequest(testApp, accessToken)
        .get(`${API_PREFIX}/domains`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return all monitored domains belonging to the authenticated user', async () => {
      const { accessToken } = await getAccessToken(testApp);
      const domain1 = createDomainDto();
      const domain2 = createDomainDto();

      await authenticatedRequest(testApp, accessToken)
        .post(`${API_PREFIX}/domains`)
        .send(domain1)
        .expect(201);

      await authenticatedRequest(testApp, accessToken)
        .post(`${API_PREFIX}/domains`)
        .send(domain2)
        .expect(201);

      const response = await authenticatedRequest(testApp, accessToken)
        .get(`${API_PREFIX}/domains`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      const domainNames = response.body.map((d: any) => d.domainName);
      expect(domainNames).toContain(domain1.domainName);
      expect(domainNames).toContain(domain2.domainName);

      for (const item of response.body) {
        expectUuid(item.id);
        if (item.createdAt) {
          expectIsoDate(item.createdAt);
        }
      }
    });
  });

  describe('Authentication Scenarios (401 Unauthorized)', () => {
    it('should return 401 Unauthorized when listing domains without Bearer token', async () => {
      const response = await testApp.request.get(`${API_PREFIX}/domains`);

      expectApiError(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('Multi-Tenant Isolation Scenarios (Cross-Tenant Security)', () => {
    it('should strictly isolate domains so User A cannot see User B domains', async () => {
      const userA = await getAccessToken(testApp);
      const userB = await getAccessToken(testApp);

      const domainA = createDomainDto({ domainName: `tenant-a-${Date.now()}.com` });
      const domainB = createDomainDto({ domainName: `tenant-b-${Date.now()}.com` });

      // User A creates domain A
      await authenticatedRequest(testApp, userA.accessToken)
        .post(`${API_PREFIX}/domains`)
        .send(domainA)
        .expect(201);

      // User B creates domain B
      await authenticatedRequest(testApp, userB.accessToken)
        .post(`${API_PREFIX}/domains`)
        .send(domainB)
        .expect(201);

      // User A queries domains -> should ONLY see domain A
      const resUserA = await authenticatedRequest(testApp, userA.accessToken)
        .get(`${API_PREFIX}/domains`)
        .expect(200);

      const userADomainNames = resUserA.body.map((d: any) => d.domainName);
      expect(userADomainNames).toContain(domainA.domainName);
      expect(userADomainNames).not.toContain(domainB.domainName);

      // User B queries domains -> should ONLY see domain B
      const resUserB = await authenticatedRequest(testApp, userB.accessToken)
        .get(`${API_PREFIX}/domains`)
        .expect(200);

      const userBDomainNames = resUserB.body.map((d: any) => d.domainName);
      expect(userBDomainNames).toContain(domainB.domainName);
      expect(userBDomainNames).not.toContain(domainA.domainName);
    });
  });
});
