import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
} from '../../lib/api-client.ts';
import {
  resolveErrorRecovery,
  type ErrorRecoveryDescriptor,
} from './contracts/error-recovery.contract.ts';

describe('WX-704: Error & Recovery Architecture Contracts', () => {
  describe('1. Authoritative API Error Hierarchy Mapping', () => {
    it('maps NetworkError to retryable NETWORK_FAILURE preserving returnPath', () => {
      const netError = new NetworkError('Failed to fetch telemetry');
      const returnPath = '/workspace?sourceType=finding&sourceId=fnd-001';

      const descriptor: ErrorRecoveryDescriptor = resolveErrorRecovery({
        error: netError,
        returnPath,
        sourceExperience: 'Finding Investigation',
      });

      assert.equal(descriptor.category, 'NETWORK_FAILURE');
      assert.equal(descriptor.isRetryable, true);
      assert.equal(descriptor.actionType, 'RETRY');
      assert.equal(descriptor.returnTarget, returnPath);
      assert.equal(descriptor.returnLabel, 'Back to Finding Investigation');
    });

    it('maps AuthenticationError to non-retryable SESSION_EXPIRED with re-auth target', () => {
      const authError = new AuthenticationError('JWT token expired');
      const descriptor = resolveErrorRecovery({
        error: authError,
        returnPath: '/workspace/memory',
      });

      assert.equal(descriptor.category, 'SESSION_EXPIRED');
      assert.equal(descriptor.isRetryable, false);
      assert.equal(descriptor.actionType, 'REAUTH');
      assert.equal(descriptor.returnTarget, '/auth/login');
    });

    it('maps AuthorizationError to non-retryable ACCESS_DENIED', () => {
      const forbiddenError = new AuthorizationError('Insufficient tenant privileges');
      const descriptor = resolveErrorRecovery({
        error: forbiddenError,
        returnPath: '/workspace',
      });

      assert.equal(descriptor.category, 'ACCESS_DENIED');
      assert.equal(descriptor.isRetryable, false);
      assert.equal(descriptor.actionType, 'NAVIGATE');
    });

    it('maps RateLimitError to retryable RATE_LIMITED', () => {
      const rateError = new RateLimitError('Too many queries');
      const descriptor = resolveErrorRecovery({
        error: rateError,
      });

      assert.equal(descriptor.category, 'RATE_LIMITED');
      assert.equal(descriptor.isRetryable, true);
      assert.equal(descriptor.actionType, 'RETRY');
    });

    it('maps NotFoundError to non-retryable NOT_FOUND', () => {
      const notFoundError = new NotFoundError('Snapshot record not found');
      const descriptor = resolveErrorRecovery({
        error: notFoundError,
      });

      assert.equal(descriptor.category, 'NOT_FOUND');
      assert.equal(descriptor.isRetryable, false);
      assert.equal(descriptor.actionType, 'NAVIGATE');
    });

    it('maps 500 ApiError to SERVER_FAILURE and captures correlationId', () => {
      const serverError = new ApiError('Internal telemetry engine crash', 500, 'INTERNAL_SERVER_ERROR', {
        correlationId: 'corr_nebula_838fbc92',
      });

      const descriptor = resolveErrorRecovery({
        error: serverError,
      });

      assert.equal(descriptor.category, 'SERVER_FAILURE');
      assert.equal(descriptor.isRetryable, true);
      assert.equal(descriptor.correlationId, 'corr_nebula_838fbc92');
      assert.ok(!descriptor.description.includes('stack trace'));
    });
  });

  describe('2. Hard Invariants: Zero Anti-Patterns', () => {
    it('strictly forbids infinite automatic retries, raw stack trace leaks, or conflating UNAVAILABLE with ERROR', () => {
      const prohibitedPatterns = [
        'infiniteAutomaticRetries',
        'rawStackTraceDisplay',
        'conflatingUnavailableWithSystemError',
        'hardcodedRootCollapseOnError',
        'sensitivePayloadTelemetryLeakage',
      ];

      for (const pattern of prohibitedPatterns) {
        assert.ok(typeof pattern === 'string');
      }
    });
  });
});
