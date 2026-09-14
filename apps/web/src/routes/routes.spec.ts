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

    it('resolves /auth/forgot-password and /forgot-password to FORGOT_PASSWORD', () => {
      assert.equal(resolveAppRoute('/auth/forgot-password'), 'FORGOT_PASSWORD');
      assert.equal(resolveAppRoute('/forgot-password'), 'FORGOT_PASSWORD');
      assert.equal(resolveAppRoute('/auth/forgot-password/'), 'FORGOT_PASSWORD');
    });

    it('resolves /auth/reset-password and /reset-password to RESET_PASSWORD', () => {
      assert.equal(resolveAppRoute('/auth/reset-password'), 'RESET_PASSWORD');
      assert.equal(resolveAppRoute('/reset-password'), 'RESET_PASSWORD');
      assert.equal(resolveAppRoute('/auth/reset-password/'), 'RESET_PASSWORD');
    });

    it('resolves /auth/reactivate and /reactivate to REACTIVATE', () => {
      assert.equal(resolveAppRoute('/auth/reactivate'), 'REACTIVATE');
      assert.equal(resolveAppRoute('/reactivate'), 'REACTIVATE');
      assert.equal(resolveAppRoute('/auth/reactivate/'), 'REACTIVATE');
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

  describe('Settings Routes', () => {
    it('resolves /settings and /settings/ to SETTINGS', () => {
      assert.equal(resolveAppRoute('/settings'), 'SETTINGS');
      assert.equal(resolveAppRoute('/settings/'), 'SETTINGS');
    });

    it('resolves /settings subroutes to SETTINGS', () => {
      assert.equal(resolveAppRoute('/settings/account'), 'SETTINGS');
      assert.equal(resolveAppRoute('/settings/security'), 'SETTINGS');
      assert.equal(resolveAppRoute('/settings/appearance'), 'SETTINGS');
    });
  });

  describe('Admin Console Routes (ADMIN-007 & ADMIN-009)', () => {
    it('resolves /admin and /admin/ to ADMIN', () => {
      assert.equal(resolveAppRoute('/admin'), 'ADMIN');
      assert.equal(resolveAppRoute('/admin/'), 'ADMIN');
    });

    it('resolves /admin/login to ADMIN', () => {
      assert.equal(resolveAppRoute('/admin/login'), 'ADMIN');
      assert.equal(resolveAppRoute('/admin/login/'), 'ADMIN');
    });

    it('resolves /admin subroutes to ADMIN', () => {
      assert.equal(resolveAppRoute('/admin/users'), 'ADMIN');
      assert.equal(resolveAppRoute('/admin/sessions'), 'ADMIN');
      assert.equal(resolveAppRoute('/admin/security'), 'ADMIN');
      assert.equal(resolveAppRoute('/admin/audit'), 'ADMIN');
    });
  });

  describe('Legal & Privacy / Terms Routes', () => {
    it('resolves /privacy and /privacy/ to PRIVACY', () => {
      assert.equal(resolveAppRoute('/privacy'), 'PRIVACY');
      assert.equal(resolveAppRoute('/privacy/'), 'PRIVACY');
    });

    it('resolves /privacy-policy and /privacy-policy/ to PRIVACY', () => {
      assert.equal(resolveAppRoute('/privacy-policy'), 'PRIVACY');
      assert.equal(resolveAppRoute('/privacy-policy/'), 'PRIVACY');
    });

    it('resolves /legal/privacy to PRIVACY', () => {
      assert.equal(resolveAppRoute('/legal/privacy'), 'PRIVACY');
    });

    it('resolves /terms and /terms/ to TERMS', () => {
      assert.equal(resolveAppRoute('/terms'), 'TERMS');
      assert.equal(resolveAppRoute('/terms/'), 'TERMS');
    });

    it('resolves /terms-and-conditions and /terms-of-service to TERMS', () => {
      assert.equal(resolveAppRoute('/terms-and-conditions'), 'TERMS');
      assert.equal(resolveAppRoute('/terms-of-service'), 'TERMS');
      assert.equal(resolveAppRoute('/legal/terms'), 'TERMS');
    });
  });

  describe('Public Documentation & Guides Routes', () => {
    it('resolves /docs and /docs/ to DOCS', () => {
      assert.equal(resolveAppRoute('/docs'), 'DOCS');
      assert.equal(resolveAppRoute('/docs/'), 'DOCS');
    });

    it('resolves /docs subroutes to DOCS', () => {
      assert.equal(resolveAppRoute('/docs/understanding-methodology'), 'DOCS');
      assert.equal(resolveAppRoute('/docs/taxonomy'), 'DOCS');
      assert.equal(resolveAppRoute('/docs/security'), 'DOCS');
    });
  });

  describe('Route Constants Integrity', () => {
    it('defines canonical constant URIs matching specifications', () => {
      assert.equal(ROUTES.HOME, '/');
      assert.equal(ROUTES.GUEST, '/guest');
      assert.equal(ROUTES.DOCS.ROOT, '/docs');
      assert.equal(ROUTES.DOCS.UNDERSTANDING, '/docs/understanding-methodology');
      assert.equal(ROUTES.WORKSPACE.CREATE, '/workspace/create');
      assert.equal(ROUTES.WORKSPACE.ROOT, '/workspace');
      assert.equal(ROUTES.AUTH.LOGIN, '/auth/login');
      assert.equal(ROUTES.AUTH.REGISTER, '/auth/register');
      assert.equal(ROUTES.AUTH.CALLBACK, '/auth/callback');
      assert.equal(ROUTES.AUTH.VERIFY_EMAIL, '/auth/verify-email');
      assert.equal(ROUTES.AUTH.FORGOT_PASSWORD, '/auth/forgot-password');
      assert.equal(ROUTES.AUTH.RESET_PASSWORD, '/auth/reset-password');
      assert.equal(ROUTES.SETTINGS.ROOT, '/settings');
      assert.equal(ROUTES.SETTINGS.ACCOUNT, '/settings/account');
      assert.equal(ROUTES.SETTINGS.SECURITY, '/settings/security');
      assert.equal(ROUTES.SETTINGS.APPEARANCE, '/settings/appearance');
      assert.equal(ROUTES.ADMIN.LOGIN, '/admin/login');
      assert.equal(ROUTES.LEGAL.PRIVACY, '/privacy');
      assert.equal(ROUTES.LEGAL.TERMS, '/terms');
    });
  });
});

