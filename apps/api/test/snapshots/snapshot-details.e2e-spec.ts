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

describe('GET /api/v1/snapshots/:snapshotId (Infrastructure Snapshot Details Regression Suite)', () => {
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

  describe('Authentication Scenarios (401 Unauthorized)', () => {
    it('should return 401 Unauthorized when requesting snapshot details without Bearer token', async () => {
      const response = await testApp.request.get(
        `${API_PREFIX}/snapshots/snp-3d91d72d-0000-0000-0000-000000000000`,
      );

      expectApiError(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('Snapshot Details & Boundary Scenarios', () => {
    it('should return security and correlation headers when querying snapshot details', async () => {
      const nonExistentSnapshotId = 'snp-3d91d72d-0000-0000-0000-000000000000';

      const response = await authenticatedRequest(testApp, userToken).get(
        `${API_PREFIX}/snapshots/${nonExistentSnapshotId}`,
      );

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);
    });
  });
});
