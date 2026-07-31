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

describe('GET /api/v1/snapshots/:snapshotId/brief & POST /api/v1/snapshots/:snapshotId/brief (Infrastructure Brief Regression Suite)', () => {
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

  describe('1. GET /api/v1/snapshots/:snapshotId/brief', () => {
    it('should return 401 Unauthorized when requesting executive brief without Bearer token', async () => {
      const response = await testApp.request.get(
        `${API_PREFIX}/snapshots/snp-3d91d72d-0000-0000-0000-000000000000/brief`,
      );

      expectApiError(response, 401, 'UNAUTHORIZED');
    });

    it('should return 404 Not Found when requesting brief for non-existent snapshot ID', async () => {
      const nonExistentSnapshotId = 'snp-3d91d72d-0000-0000-0000-000000000000';

      const response = await authenticatedRequest(testApp, userToken).get(
        `${API_PREFIX}/snapshots/${nonExistentSnapshotId}/brief`,
      );

      expectApiError(response, 404, 'NOT_FOUND');
    });
  });

  describe('2. POST /api/v1/snapshots/:snapshotId/brief', () => {
    it('should return 401 Unauthorized when generating executive brief without Bearer token', async () => {
      const response = await testApp.request.post(
        `${API_PREFIX}/snapshots/snp-3d91d72d-0000-0000-0000-000000000000/brief`,
      );

      expectApiError(response, 401, 'UNAUTHORIZED');
    });

    it('should return 404 Not Found when generating brief for non-existent snapshot ID', async () => {
      const nonExistentSnapshotId = 'snp-3d91d72d-0000-0000-0000-000000000000';

      const response = await authenticatedRequest(testApp, userToken).post(
        `${API_PREFIX}/snapshots/${nonExistentSnapshotId}/brief`,
      );

      expectApiError(response, 404, 'NOT_FOUND');
    });
  });
});
