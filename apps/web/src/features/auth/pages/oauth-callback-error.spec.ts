import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapOAuthError } from '../utils/oauth-error.util.ts';
import { resolveAppRoute } from '../../../routes/routes.ts';

describe('AUTH-019-FIX: OAuth Error Boundary & Frontend Error Mapping', () => {
  describe('1. OAuth Route Resolution Contracts', () => {
    it('resolves /auth/callback correctly', () => {
      assert.equal(resolveAppRoute('/auth/callback'), 'AUTH_CALLBACK');
      assert.equal(resolveAppRoute('/auth/callback/'), 'AUTH_CALLBACK');
    });
  });

  describe('2. GitHub Email Unverified Failure Mapping', () => {
    it('maps github_email_unverified into exact user-facing verification copy and actions', () => {
      const error = mapOAuthError('github_email_unverified');
      assert.equal(error.title, 'Verify your GitHub email');
      assert.equal(
        error.body,
        'Nebula needs a verified email address to complete GitHub sign-in.',
      );
      assert.ok(error.instruction?.includes('Verify your email address in GitHub'));
      assert.equal(error.iconType, 'unverified_email');
      assert.equal(error.primaryAction?.label, 'Try GitHub Again');
      assert.equal(error.primaryAction?.href, '/api/v1/auth/github');
      assert.equal(error.secondaryAction?.label, 'Return to Sign In');
      assert.equal(error.secondaryAction?.href, '/login');
    });

    it('maps account_deactivated into dedicated recovery copy and action without email', () => {
      const error = mapOAuthError('account_deactivated');
      assert.equal(error.title, 'Account deactivated');
      assert.equal(
        error.body,
        'Your Nebula account is currently deactivated. Your infrastructure history and workspace data are preserved.',
      );
      assert.equal(error.iconType, 'account_deactivated');
      assert.equal(error.primaryAction?.label, 'Reactivate your account');
      assert.equal(error.primaryAction?.href, '/auth/reactivate');
      assert.equal(error.secondaryAction?.label, 'Return to Sign In');
      assert.equal(error.secondaryAction?.href, '/login');
    });

    it('maps account_deactivated with pre-filled email parameter when available', () => {
      const error = mapOAuthError('account_deactivated', 'alex@example.com');
      assert.equal(error.primaryAction?.href, '/auth/reactivate?email=alex%40example.com');
    });
  });

  describe('3. OAuth User Cancellation Mapping', () => {
    it('maps oauth_denied into non-fault cancellation copy', () => {
      const error = mapOAuthError('oauth_denied');
      assert.equal(error.title, 'GitHub sign-in cancelled');
      assert.equal(error.body, 'No changes were made to your Nebula account.');
      assert.equal(error.iconType, 'denied');
      assert.equal(error.primaryAction?.label, 'Return to Sign In');
      assert.equal(error.primaryAction?.href, '/login');
    });
  });

  describe('4. Provider & Session Failure Mapping', () => {
    it('maps oauth_provider_error into friendly retry copy', () => {
      const error = mapOAuthError('oauth_provider_error');
      assert.equal(error.title, "We couldn't complete sign-in");
      assert.equal(
        error.body,
        'Something prevented Nebula from completing authentication. Please try again.',
      );
      assert.equal(error.iconType, 'error');
      assert.equal(error.primaryAction?.label, 'Try Again');
      assert.equal(error.primaryAction?.href, '/login');
    });

    it('maps oauth_invalid_request into friendly retry copy', () => {
      const error = mapOAuthError('oauth_invalid_request');
      assert.equal(error.title, "We couldn't complete sign-in");
      assert.equal(error.iconType, 'error');
    });
  });

  describe('5. Unknown Error Code Safe Fallback', () => {
    it('safely falls back unknown error codes to generic error without leaking raw strings', () => {
      const error = mapOAuthError('completely_unknown_xss_payload_<script>');
      assert.equal(error.title, "We couldn't complete sign-in");
      assert.equal(
        error.body,
        'Something prevented Nebula from completing authentication. Please try again.',
      );
      assert.equal(error.iconType, 'error');
      assert.equal(error.primaryAction?.label, 'Try Again');
      assert.equal(error.secondaryAction?.label, 'Return to Sign In');
    });

    it('handles null / undefined error codes gracefully', () => {
      const errorNull = mapOAuthError(null);
      assert.equal(errorNull.title, "We couldn't complete sign-in");

      const errorEmpty = mapOAuthError('');
      assert.equal(errorEmpty.title, "We couldn't complete sign-in");
    });
  });
});
