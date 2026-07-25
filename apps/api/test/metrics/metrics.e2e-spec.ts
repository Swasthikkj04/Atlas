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

describe('GET /api/v1/metrics (Platform Operational Telemetry Metrics)', () => {
  let testApp: TestAppInstance;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  it('should return 200 OK with Prometheus exposition format text', async () => {
    const response = await testApp.request
      .get(`${API_PREFIX}/metrics`)
      .expect(200);

    expectSecurityHeaders(response);
    expectCorrelationHeaders(response);

    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toContain('atlas_process_uptime_seconds');
    expect(response.text).toContain('atlas_db_connection_status');
  });
});
