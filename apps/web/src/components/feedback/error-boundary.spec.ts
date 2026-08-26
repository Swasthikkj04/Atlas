import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveErrorBoundaryState,
  generateErrorReferenceId,
  shouldErrorBoundaryReset,
} from './error-boundary.core.ts';

describe('WX-001: ErrorBoundary State & Static Derivation Contracts', () => {
  it('generates a valid error state and unique error reference ID on derived error', () => {
    const testError = new Error('Test crash in render pipeline');
    const derivedState = deriveErrorBoundaryState(testError);

    assert.equal(derivedState.hasError, true);
    assert.equal(derivedState.error, testError);
    assert.ok(typeof derivedState.errorId === 'string');
    assert.ok(derivedState.errorId.startsWith('err_'));
  });

  it('generates distinct error IDs for consecutive failures', () => {
    const id1 = generateErrorReferenceId();
    const id2 = generateErrorReferenceId();
    assert.notEqual(id1, id2);
  });

  it('determines whether error boundary should reset based on resetKeys', () => {
    assert.equal(shouldErrorBoundaryReset(undefined, undefined), false);
    assert.equal(shouldErrorBoundaryReset(['keyA'], ['keyA']), false);
    assert.equal(shouldErrorBoundaryReset(['keyA'], ['keyB']), true);
    assert.equal(shouldErrorBoundaryReset(['keyA'], ['keyA', 'keyB']), true);
  });
});
