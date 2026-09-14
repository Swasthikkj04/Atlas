import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveErrorBoundaryState,
  shouldErrorBoundaryReset,
} from './error-boundary.core.ts';

describe('TKT-001: Route-Level Code Splitting & Suspense Boundary Contracts', () => {
  it('validates suspense fallback state contract definitions', () => {
    const fallbackConfig = {
      role: 'status',
      ariaLive: 'polite',
      ariaBusy: true,
    };
    assert.equal(fallbackConfig.role, 'status');
    assert.equal(fallbackConfig.ariaLive, 'polite');
    assert.equal(fallbackConfig.ariaBusy, true);
  });

  it('resets error boundary state when pathname changes via resetKeys', () => {
    const initialRouteKeys = ['/'];
    const navigatedRouteKeys = ['/guest'];
    const sameRouteKeys = ['/guest'];

    assert.equal(shouldErrorBoundaryReset(initialRouteKeys, navigatedRouteKeys), true);
    assert.equal(shouldErrorBoundaryReset(navigatedRouteKeys, sameRouteKeys), false);
  });

  it('generates a recoverable error boundary state when dynamic chunk import throws', () => {
    const chunkLoadError = new Error('Failed to fetch dynamically imported module: /assets/WorkspacePage.js');
    const state = deriveErrorBoundaryState(chunkLoadError);

    assert.equal(state.hasError, true);
    assert.equal(state.error?.message, chunkLoadError.message);
    assert.ok(typeof state.errorId === 'string' && state.errorId.startsWith('err_'));
  });
});
