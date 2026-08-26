import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES, resolveAppRoute } from '../../routes/routes.ts';

describe('WX-101: Workspace Route & Entry Contracts', () => {
  describe('1. Canonical Workspace Route Resolution', () => {
    it('resolves /workspace to WORKSPACE', () => {
      assert.equal(resolveAppRoute('/workspace'), 'WORKSPACE');
      assert.equal(resolveAppRoute('/workspace/'), 'WORKSPACE');
    });

    it('resolves /dashboard alias to WORKSPACE', () => {
      assert.equal(resolveAppRoute('/dashboard'), 'WORKSPACE');
      assert.equal(resolveAppRoute('/dashboard/'), 'WORKSPACE');
    });

    it('preserves /workspace/create priority before generic /workspace', () => {
      assert.equal(resolveAppRoute('/workspace/create'), 'CREATE_WORKSPACE');
      assert.equal(resolveAppRoute('/workspace/create/'), 'CREATE_WORKSPACE');
    });

    it('verifies ROUTES constants contract', () => {
      assert.equal(ROUTES.WORKSPACE.ROOT, '/workspace');
      assert.equal(ROUTES.WORKSPACE.DASHBOARD_ALIAS, '/dashboard');
      assert.equal(ROUTES.WORKSPACE.CREATE, '/workspace/create');
    });
  });

  describe('2. Route Independence & Regression Boundaries', () => {
    it('verifies non-workspace routes are unaffected', () => {
      assert.equal(resolveAppRoute('/'), 'LANDING');
      assert.equal(resolveAppRoute('/guest'), 'GUEST');
      assert.equal(resolveAppRoute('/auth/login'), 'LOGIN');
      assert.equal(resolveAppRoute('/auth/register'), 'CREATE_WORKSPACE');
    });
  });
});
