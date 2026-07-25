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

describe('GET /api/v1/workspace/brief (Workspace Aggregate Statistics Regression Suite)', () => {
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

  it('should return workspace aggregate statistics and brief overview', async () => {
    const response = await authenticatedRequest(testApp, userToken)
      .get(`${API_PREFIX}/workspace/brief`)
      .expect(200);

    expectSecurityHeaders(response);
    expectCorrelationHeaders(response);

    expect(response.body).toEqual(
      expect.objectContaining({
        summary: expect.any(Object),
        health: expect.any(Object),
      }),
    );
  });

  it('should return 401 Unauthorized when requesting workspace brief without Bearer token', async () => {
    const response = await testApp.request.get(`${API_PREFIX}/workspace/brief`);

    expectApiError(response, 401, 'UNAUTHORIZED');
  });
});
