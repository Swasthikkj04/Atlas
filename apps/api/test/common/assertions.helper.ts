import { REGEX_ISO_DATE, REGEX_UUID } from './constants';

export function expectUuid(value: any): void {
  expect(typeof value).toBe('string');
  expect(value).toMatch(REGEX_UUID);
}

export function expectIsoDate(value: any): void {
  expect(typeof value).toBe('string');
  expect(value).toMatch(REGEX_ISO_DATE);
}

export function expectCorrelationHeaders(response: any): void {
  expect(response.headers).toHaveProperty('x-correlation-id');
  expect(response.headers).toHaveProperty('x-request-id');
}

export function expectSecurityHeaders(response: any): void {
  expect(response.headers).not.toHaveProperty('x-powered-by');
  expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
  expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
  expect(response.headers).toHaveProperty(
    'referrer-policy',
    'strict-origin-when-cross-origin',
  );
  expect(response.headers).toHaveProperty('permissions-policy');
}

export function expectApiError(
  response: any,
  expectedStatusCode: number,
  expectedCode?: string,
): void {
  expect(response.status).toBe(expectedStatusCode);
  expectCorrelationHeaders(response);
  expectSecurityHeaders(response);
  expect(response.body).toHaveProperty('statusCode', expectedStatusCode);
  expect(response.body).toHaveProperty('error');
  expect(response.body).toHaveProperty('code');
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('correlationId');
  expect(response.body).toHaveProperty('timestamp');

  if (expectedCode) {
    expect(response.body.code).toBe(expectedCode);
  }
}
