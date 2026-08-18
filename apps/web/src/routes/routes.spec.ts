import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAppRoute, ROUTES } from './routes.ts';

describe('ROUTE-001: Canonical Frontend Route Resolution Engine', () => {
  describe('Specific Create Workspace Route Priority (ROUTE-001 Fix)', () => {
    it('resolves /workspace/create to CREATE_WORKSPACE instead of being captured by /workspace', () => {
      assert.equal(resolveAppRoute('/workspace/create'), 'CREATE_WORKSPACE');
    });

    it('resolves /workspace/create with trailing slash to CREATE_WORKSPACE', () => {
      assert.equal(resolveAppRoute('/workspace/create/'), 'CREATE_WORKSPACE');
    });

    it('resolves /create-workspace and /create-workspace/ to CREATE_WORKSPACE', () => {
      assert.equal(resolveAppRoute('/create-workspace'), 'CREATE_WORKSPACE');
      assert.equal(resolveAppRoute('/create-workspace/'), 'CREATE_WORKSPACE');
    });

    it('resolves /auth/register and /register to CREATE_WORKSPACE', () => {
      assert.equal(resolveAppRoute('/auth/register'), 'CREATE_WORKSPACE');
      assert.equal(resolveAppRoute('/register'), 'CREATE_WORKSPACE');
    });
  });

  describe('Authenticated Workspace Routes', () => {
    it('resolves /workspace and /workspace/ to WORKSPACE', () => {
      assert.equal(resolveAppRoute('/workspace'), 'WORKSPACE');
      assert.equal(resolveAppRoute('/workspace/'), 'WORKSPACE');
    });

    it('resolves /workspace subroutes (e.g. /workspace/settings) to WORKSPACE', () => {
      assert.equal(resolveAppRoute('/workspace/settings'), 'WORKSPACE');
      assert.equal(resolveAppRoute('/workspace/domains'), 'WORKSPACE');
    });

    it('resolves /dashboard and /dashboard/ aliases to WORKSPACE', () => {
      assert.equal(resolveAppRoute('/dashboard'), 'WORKSPACE');
      assert.equal(resolveAppRoute('/dashboard/overview'), 'WORKSPACE');
    });
  });

  describe('Authentication Routes', () => {
    it('resolves /auth/login and /login to LOGIN', () => {
      assert.equal(resolveAppRoute('/auth/login'), 'LOGIN');
      assert.equal(resolveAppRoute('/login'), 'LOGIN');
    });

    it('resolves /auth/verify-email and /verify-email to VERIFY_EMAIL', () => {
      assert.equal(resolveAppRoute('/auth/verify-email'), 'VERIFY_EMAIL');
      assert.equal(resolveAppRoute('/verify-email'), 'VERIFY_EMAIL');
    });

    it('resolves /auth/callback to AUTH_CALLBACK', () => {
      assert.equal(resolveAppRoute('/auth/callback'), 'AUTH_CALLBACK');
    });
  });

  describe('Guest Experience & Public Landing Routes', () => {
    it('resolves /guest and /guest/ to GUEST', () => {
      assert.equal(resolveAppRoute('/guest'), 'GUEST');
      assert.equal(resolveAppRoute('/guest/'), 'GUEST');
    });

    it('resolves / and empty paths to LANDING', () => {
      assert.equal(resolveAppRoute('/'), 'LANDING');
      assert.equal(resolveAppRoute(''), 'LANDING');
    });

    it('falls back unknown routes to LANDING', () => {
      assert.equal(resolveAppRoute('/unknown-path'), 'LANDING');
      assert.equal(resolveAppRoute('/some/random/route'), 'LANDING');
    });
  });

  describe('Route Constants Integrity', () => {
    it('defines canonical constant URIs matching specifications', () => {
      assert.equal(ROUTES.HOME, '/');
      assert.equal(ROUTES.GUEST, '/guest');
      assert.equal(ROUTES.WORKSPACE.CREATE, '/workspace/create');
      assert.equal(ROUTES.WORKSPACE.ROOT, '/workspace');
      assert.equal(ROUTES.AUTH.LOGIN, '/auth/login');
      assert.equal(ROUTES.AUTH.REGISTER, '/auth/register');
      assert.equal(ROUTES.AUTH.CALLBACK, '/auth/callback');
      assert.equal(ROUTES.AUTH.VERIFY_EMAIL, '/auth/verify-email');
    });
  });
});
