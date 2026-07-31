import { API_PREFIX } from '../common/constants';
import {
  expectApiError,
  expectCorrelationHeaders,
  expectSecurityHeaders,
} from '../common/assertions.helper';
import { authenticatedRequest, getAccessToken } from '../common/auth.helper';
import {
  closeTestApp,
  createTestApp,
  TestAppInstance,
} from '../common/test-app.helper';

describe('GET /api/v1/search (Global Search Regression Suite)', () => {
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

  it('should perform global search across domains, findings, and activity events', async () => {
    const response = await authenticatedRequest(testApp, userToken)
      .get(`${API_PREFIX}/search?q=google`)
      .expect(200);

    expectSecurityHeaders(response);
    expectCorrelationHeaders(response);

    expect(response.body).toEqual(
      expect.objectContaining({
        query: 'google',
        total: expect.any(Number),
        data: expect.any(Array),
      }),
    );
  });

  it('should return 401 Unauthorized when searching without Bearer token', async () => {
    const response = await testApp.request.get(`${API_PREFIX}/search?q=google`);

    expectApiError(response, 401, 'UNAUTHORIZED');
  });
});
