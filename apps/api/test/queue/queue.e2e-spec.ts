import { API_PREFIX } from '../common/constants';
import {
  expectCorrelationHeaders,
  expectSecurityHeaders,
} from '../common/assertions.helper';
import {
  closeTestApp,
  createTestApp,
  TestAppInstance,
} from '../common/test-app.helper';

describe('GET /api/v1/queue (Queue Diagnostics & Operational Monitoring)', () => {
  let testApp: TestAppInstance;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  it('should return 200 OK with queue diagnostics and operational metrics', async () => {
    const response = await testApp.request
      .get(`${API_PREFIX}/queue`)
      .expect(200);

    expectSecurityHeaders(response);
    expectCorrelationHeaders(response);

    expect(response.body).toEqual(
      expect.objectContaining({
        status: expect.any(String),
        timestamp: expect.any(String),
        jobs: expect.objectContaining({
          queued: expect.any(Number),
          running: expect.any(Number),
          completed: expect.any(Number),
          failed: expect.any(Number),
        }),
      }),
    );
  });
});
