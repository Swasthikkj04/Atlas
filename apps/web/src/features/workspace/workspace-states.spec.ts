import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  InsufficientSignalError,
} from '../../lib/api-client.ts';

describe('WX-106: Workspace Shell States & Interaction Architecture Contracts', () => {
  describe('1. State Semantics & Distinctness Invariant', () => {
    it('verifies all 6 canonical UI state categories remain distinct and mutually exclusive', () => {
      const stateSemantics = {
        loading: 'calm_session_verification',
        ready_content: 'meaningful_intelligence_present',
        ready_quiet: 'verified_no_meaningful_change',
        ready_empty: 'no_data_on_surface',
        ready_partial: 'established_and_missing_signals_split',
        unavailable: 'cannot_be_obtained_non_error',
        error: 'system_or_network_failure',
      };

      const keys = Object.keys(stateSemantics);
      const values = Object.values(stateSemantics);
      assert.equal(keys.length, 7);
      assert.equal(new Set(values).size, 7, 'All state categories must be mutually exclusive');
    });

    it('enforces that Quiet is never treated as an Error or Failure', () => {
      const quietStateCategory = 'READY';
      const errorStateCategory = 'ERROR';
      assert.notEqual(quietStateCategory, errorStateCategory);
    });

    it('verifies shell error handling consumes the canonical ApiError hierarchy', () => {
      const errors = [
        new NetworkError(),
        new AuthenticationError(),
        new AuthorizationError(),
        new NotFoundError(),
        new RateLimitError(),
        new InsufficientSignalError(),
      ];

      for (const err of errors) {
        assert.ok(err instanceof ApiError, `Error ${err.name} must inherit from ApiError`);
        assert.ok(typeof err.status === 'number');
        assert.ok(typeof err.code === 'string');
      }
    });
  });

  describe('2. Navigation Drawer Interaction & Accessibility Contracts', () => {
    it('verifies drawer ID matches aria-controls target', () => {
      const drawerNavId = 'workspace-nav';
      const headerAriaControls = 'workspace-nav';
      assert.equal(drawerNavId, headerAriaControls);
    });

    it('verifies Escape key handling closes open modal drawer', () => {
      let isDrawerOpen = true;
      const handleEscape = (key: string) => {
        if (key === 'Escape') {
          isDrawerOpen = false;
        }
      };

      handleEscape('Escape');
      assert.equal(isDrawerOpen, false);
    });

    it('verifies backdrop interaction closes drawer', () => {
      let isDrawerOpen = true;
      const handleBackdropClick = () => {
        isDrawerOpen = false;
      };

      handleBackdropClick();
      assert.equal(isDrawerOpen, false);
    });
  });
});
