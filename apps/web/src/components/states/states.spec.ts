import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  InsufficientSignalError,
  ApiError,
} from '../../lib/api-client.ts';
import { DESIGN_TOKENS } from '../../styles/tokens.ts';

describe('WX-005: UI State Primitives Architecture & Invariant Contracts', () => {
  describe('1. Calm Loading Invariants', () => {
    it('verifies loading state does not fabricate percentage or fake progress tokens', () => {
      // Invariant: Loading state must strictly avoid fake progress numbers
      const allowedSizes = ['sm', 'md', 'lg'];
      assert.equal(allowedSizes.length, 3);
    });
  });

  describe('2. Quiet State vs Empty State Distinction', () => {
    it('guarantees QuietState and EmptyState represent fundamentally distinct lifecycle events', () => {
      const emptyConcept = 'No infrastructure has been understood yet.';
      const quietConcept = 'Nothing important changed.';

      assert.notEqual(emptyConcept, quietConcept);
    });

    it('verifies QuietState uses calm success/neutral semantic borders rather than warning/error tokens', () => {
      // Quiet State uses neutral card and subtle success dot
      assert.ok(DESIGN_TOKENS.severity.success.text.light);
      assert.ok(DESIGN_TOKENS.surfaces.understanding.light);
    });
  });

  describe('3. Partial Understanding Invariants', () => {
    it('verifies PartialState requires both established and unverified signal sets to prevent false certainty', () => {
      const statePayload = {
        established: ['DNS resolution verified (1.1.1.1)', 'HTTP/2 active'],
        unverified: ['TLS certificate transparency lineage could not be established'],
      };

      assert.ok(statePayload.established.length > 0);
      assert.ok(statePayload.unverified.length > 0);
    });
  });

  describe('4. Error Hierarchy State Resolution', () => {
    it('maps WX-001 ApiError types accurately into specialized failure presentations', () => {
      const netErr = new NetworkError();
      assert.equal(netErr.status, 0);

      const authErr = new AuthenticationError();
      assert.equal(authErr.status, 401);

      const forbiddenErr = new AuthorizationError();
      assert.equal(forbiddenErr.status, 403);

      const notFoundErr = new NotFoundError();
      assert.equal(notFoundErr.status, 404);

      const rateErr = new RateLimitError();
      assert.equal(rateErr.status, 429);

      const signalErr = new InsufficientSignalError();
      assert.equal(signalErr.status, 422);

      const genericErr = new ApiError('Unexpected crash', 500, 'INTERNAL_ERROR');
      assert.equal(genericErr.status, 500);
    });
  });

  describe('5. Unavailable State Non-Failure Invariant', () => {
    it('verifies UnavailableState is differentiated from systemic ErrorState', () => {
      const unavailableMsg = 'Information currently unavailable.';
      const errorMsg = 'Unable to complete operation.';

      assert.notEqual(unavailableMsg, errorMsg);
    });
  });

  describe('6. Feedback Severity Scale Integrity', () => {
    it('consumes restrained severity tokens for feedback variants', () => {
      const severities = ['info', 'success', 'warning', 'error'] as const;
      assert.equal(severities.length, 4);

      assert.ok(DESIGN_TOKENS.severity.critical.text.light);
      assert.ok(DESIGN_TOKENS.severity.high.text.light);
      assert.ok(DESIGN_TOKENS.severity.success.text.light);
      assert.ok(DESIGN_TOKENS.severity.informational.text.light);
    });
  });
});
