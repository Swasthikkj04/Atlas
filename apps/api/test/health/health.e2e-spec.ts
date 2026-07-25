import { API_PREFIX } from '../common/constants';
import {
  expectCorrelationHeaders,
  expectIsoDate,
  expectSecurityHeaders,
} from '../common/assertions.helper';
import {
  closeTestApp,
  createTestApp,
  TestAppInstance,
} from '../common/test-app.helper';

describe('Health Operations Suite (GET /health, /health/live, /health/ready)', () => {
  let testApp: TestAppInstance;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('1. GET /api/v1/health/live (Liveness Probe)', () => {
    it('should return 200 OK with process liveness payload', async () => {
      const response = await testApp.request
        .get(`${API_PREFIX}/health/live`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.body).toEqual(
        expect.objectContaining({
          status: 'UP',
          service: expect.any(String),
          version: expect.any(String),
          uptimeSeconds: expect.any(Number),
          timestamp: expect.any(String),
        }),
      );

      expectIsoDate(response.body.timestamp);
    });
  });

  describe('2. GET /api/v1/health/ready (Readiness Probe)', () => {
    it('should return 200 OK with readiness status and dependency checks', async () => {
      const response = await testApp.request
        .get(`${API_PREFIX}/health/ready`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.body).toEqual(
        expect.objectContaining({
          status: expect.any(String),
          service: expect.any(String),
          version: expect.any(String),
          checks: expect.any(Object),
          timestamp: expect.any(String),
        }),
      );

      expectIsoDate(response.body.timestamp);
    });
  });

  describe('3. GET /api/v1/health (Overall Health Summary)', () => {
    it('should return 200 OK with overall platform health summary', async () => {
      const response = await testApp.request
        .get(`${API_PREFIX}/health`)
        .expect(200);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.body).toEqual(
        expect.objectContaining({
          status: expect.any(String),
          service: expect.any(String),
          version: expect.any(String),
          checks: expect.any(Object),
          timestamp: expect.any(String),
        }),
      );

      expectIsoDate(response.body.timestamp);
    });
  });
});
