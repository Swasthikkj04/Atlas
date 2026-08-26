import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiClient,
  ApiError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  InsufficientSignalError,
  RateLimitError,
} from './api-client.ts';

describe('WX-001: API Client & Error Hierarchy Contracts', () => {
  it('instantiates ApiClient with custom or default baseUrl', () => {
    const client = new ApiClient({ baseUrl: 'https://api.nebula.internal' });
    assert.ok(client instanceof ApiClient);
  });

  it('correctly subclasses ApiError and preserves status and code', () => {
    const err = new ApiError('Custom error', 400, 'BAD_REQUEST', { field: 'domain' });
    assert.ok(err instanceof Error);
    assert.ok(err instanceof ApiError);
    assert.equal(err.name, 'ApiError');
    assert.equal(err.status, 400);
    assert.equal(err.code, 'BAD_REQUEST');
    assert.deepEqual(err.details, { field: 'domain' });
  });

  it('implements NetworkError with status 0 and NETWORK_FAILURE code', () => {
    const err = new NetworkError();
    assert.ok(err instanceof ApiError);
    assert.equal(err.status, 0);
    assert.equal(err.code, 'NETWORK_FAILURE');
  });

  it('implements AuthenticationError with status 401 and AUTH_REQUIRED code', () => {
    const err = new AuthenticationError();
    assert.ok(err instanceof ApiError);
    assert.equal(err.status, 401);
    assert.equal(err.code, 'AUTH_REQUIRED');
  });

  it('implements AuthorizationError with status 403 and FORBIDDEN code', () => {
    const err = new AuthorizationError();
    assert.ok(err instanceof ApiError);
    assert.equal(err.status, 403);
    assert.equal(err.code, 'FORBIDDEN');
  });

  it('implements NotFoundError with status 404 and NOT_FOUND code', () => {
    const err = new NotFoundError();
    assert.ok(err instanceof ApiError);
    assert.equal(err.status, 404);
    assert.equal(err.code, 'NOT_FOUND');
  });

  it('implements InsufficientSignalError with status 422 and DOMAIN_INSUFFICIENT_SIGNAL code', () => {
    const err = new InsufficientSignalError();
    assert.ok(err instanceof ApiError);
    assert.equal(err.status, 422);
    assert.equal(err.code, 'DOMAIN_INSUFFICIENT_SIGNAL');
  });

  it('implements RateLimitError with status 429 and RATE_LIMIT_EXCEEDED code', () => {
    const err = new RateLimitError();
    assert.ok(err instanceof ApiError);
    assert.equal(err.status, 429);
    assert.equal(err.code, 'RATE_LIMIT_EXCEEDED');
  });

  it('normalizes relative and prefixed URLs with authoritative /api/v1 prefix', () => {
    const browserClient = new ApiClient({ baseUrl: '' });
    assert.equal(browserClient.resolveUrl('/domains'), '/api/v1/domains');
    assert.equal(browserClient.resolveUrl('/domains/123/understand'), '/api/v1/domains/123/understand');
    assert.equal(browserClient.resolveUrl('/jobs/job-1'), '/api/v1/jobs/job-1');
    assert.equal(browserClient.resolveUrl('/api/v1/guest/understand'), '/api/v1/guest/understand');

    const backendClient = new ApiClient({ baseUrl: 'http://localhost:3000' });
    assert.equal(backendClient.resolveUrl('/domains'), 'http://localhost:3000/api/v1/domains');
    assert.equal(backendClient.resolveUrl('/api/v1/domains'), 'http://localhost:3000/api/v1/domains');

    const fullClient = new ApiClient({ baseUrl: 'http://localhost:3000/api/v1' });
    assert.equal(fullClient.resolveUrl('/domains'), 'http://localhost:3000/api/v1/domains');
    assert.equal(fullClient.resolveUrl('/api/v1/domains'), 'http://localhost:3000/api/v1/domains');
  });
});
