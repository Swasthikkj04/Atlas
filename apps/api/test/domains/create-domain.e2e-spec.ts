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
import {
  createDomainDto,
  invalidDomainDto,
  randomDomain,
} from '../common/factories.helper';
import {
  closeTestApp,
  createTestApp,
  TestAppInstance,
} from '../common/test-app.helper';

describe('POST /api/v1/domains (Domain Management Regression Suite)', () => {
  let testApp: TestAppInstance;
  let userToken: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    const auth = await getAccessToken(testApp);
    userToken = auth.accessToken;
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('Success Scenarios (201 Created)', () => {
    it('should successfully create a new monitored domain and return DomainResponseDto with Location header', async () => {
      const domainDto = createDomainDto();

      const response = await authenticatedRequest(testApp, userToken)
        .post(`${API_PREFIX}/domains`)
        .send(domainDto)
        .expect(201);

      expectSecurityHeaders(response);
      expectCorrelationHeaders(response);

      expect(response.headers).toHaveProperty('location');
      expect(response.headers.location).toMatch(
        new RegExp(`${API_PREFIX}/domains/.+`),
      );

      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          domainName: domainDto.domainName,
          monitoringEnabled: expect.any(Boolean),
        }),
      );

      expectUuid(response.body.id);
      if (response.body.createdAt) {
        expectIsoDate(response.body.createdAt);
      }
    });
  });

  describe('Validation Error Scenarios (400 Bad Request)', () => {
    it('should return 400 Bad Request when domain format is invalid', async () => {
      const invalidDto = invalidDomainDto();

      const response = await authenticatedRequest(testApp, userToken)
        .post(`${API_PREFIX}/domains`)
        .send(invalidDto);

      expectApiError(response, 400, 'BAD_REQUEST');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 Bad Request when domain payload is empty or missing domainName', async () => {
      const response = await authenticatedRequest(testApp, userToken)
        .post(`${API_PREFIX}/domains`)
        .send({});

      expectApiError(response, 400, 'BAD_REQUEST');
    });

    it('should return 400 Bad Request when extra non-whitelisted parameters are sent', async () => {
      const extraDto = {
        domainName: randomDomain('valid'),
        unauthorizedRoleOverride: 'admin',
      };

      const response = await authenticatedRequest(testApp, userToken)
        .post(`${API_PREFIX}/domains`)
        .send(extraDto);

      expectApiError(response, 400, 'BAD_REQUEST');
    });
  });

  describe('Authentication Scenarios (401 Unauthorized)', () => {
    it('should return 401 Unauthorized when creating a domain without Bearer token', async () => {
      const response = await testApp.request
        .post(`${API_PREFIX}/domains`)
        .send(createDomainDto());

      expectApiError(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('Conflict Error Scenarios (409 Conflict)', () => {
    it('should return 409 Conflict when creating a duplicate domain for the same user', async () => {
      const domainDto = createDomainDto();

      // First creation -> 201 Created
      await authenticatedRequest(testApp, userToken)
        .post(`${API_PREFIX}/domains`)
        .send(domainDto)
        .expect(201);

      // Second creation -> 409 Conflict
      const response = await authenticatedRequest(testApp, userToken)
        .post(`${API_PREFIX}/domains`)
        .send(domainDto);

      expectApiError(response, 409, 'CONFLICT');
      expect(response.body.message).toMatch(/already exists/i);
    });
  });
});
