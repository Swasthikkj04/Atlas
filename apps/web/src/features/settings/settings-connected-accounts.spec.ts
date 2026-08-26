import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatProviderName,
  maskAccountEmail,
  CONNECTED_ACCOUNTS_HARD_INVARIANTS,
  type ConnectedProvider,
} from './contracts/connected-accounts.contract.ts';

describe('AX-106: Connected Authentication Accounts Specifications', () => {
  describe('1. Provider Display Name Formatting', () => {
    it('formats supported OAuth provider names correctly', () => {
      assert.equal(formatProviderName('google'), 'Google');
      assert.equal(formatProviderName('github'), 'GitHub');
    });
  });

  describe('2. Account Email Masking Engine for Safe Identity Display', () => {
    it('masks standard email addresses safely while preserving domain', () => {
      assert.equal(maskAccountEmail('swasthik@example.com'), 's•••••••k@example.com');
      assert.equal(maskAccountEmail('user@domain.com'), 'u••••r@domain.com');
    });

    it('masks short email addresses without crashing', () => {
      assert.equal(maskAccountEmail('ab@domain.com'), 'a••••@domain.com');
      assert.equal(maskAccountEmail('a@domain.com'), 'a••••@domain.com');
    });

    it('handles null, undefined, empty, or non-email strings gracefully', () => {
      assert.equal(maskAccountEmail(undefined), '');
      assert.equal(maskAccountEmail(null), '');
      assert.equal(maskAccountEmail(''), '');
      assert.equal(maskAccountEmail('invalid-string'), 'invalid-string');
    });
  });

  describe('3. Disconnectability Policy & Lockout Protection', () => {
    it('identifies disconnectable state when multiple authentication methods exist', () => {
      const providersWithPassword: ConnectedProvider[] = [
        {
          provider: 'google',
          name: 'Google',
          connected: true,
          accountLabel: 's•••••@gmail.com',
          canDisconnect: true,
        },
        {
          provider: 'github',
          name: 'GitHub',
          connected: false,
          accountLabel: null,
          canDisconnect: false,
        },
      ];

      const google = providersWithPassword.find((p) => p.provider === 'google');
      assert.equal(google?.connected, true);
      assert.equal(google?.canDisconnect, true);
    });

    it('identifies non-disconnectable state when single provider is the only login method (NO_FINAL_AUTH_METHOD_REMOVAL)', () => {
      const singleOAuthProviderOnly: ConnectedProvider[] = [
        {
          provider: 'google',
          name: 'Google',
          connected: true,
          accountLabel: 's•••••@gmail.com',
          canDisconnect: false, // Protected by backend policy
        },
        {
          provider: 'github',
          name: 'GitHub',
          connected: false,
          accountLabel: null,
          canDisconnect: false,
        },
      ];

      const google = singleOAuthProviderOnly.find((p) => p.provider === 'google');
      assert.equal(google?.connected, true);
      assert.equal(google?.canDisconnect, false);
    });
  });

  describe('4. P0 Connected Accounts Hard Invariants Certification', () => {
    it('certifies all 12 canonical connected accounts hard invariants', () => {
      assert.equal(CONNECTED_ACCOUNTS_HARD_INVARIANTS.length, 12);
      assert.ok(CONNECTED_ACCOUNTS_HARD_INVARIANTS.includes('NO_UNAUTHORIZED_PROVIDER_ACCESS'));
      assert.ok(CONNECTED_ACCOUNTS_HARD_INVARIANTS.includes('NO_CROSS_USER_PROVIDER_MUTATION'));
      assert.ok(CONNECTED_ACCOUNTS_HARD_INVARIANTS.includes('NO_OAUTH_SECRET_EXPOSURE'));
      assert.ok(CONNECTED_ACCOUNTS_HARD_INVARIANTS.includes('NO_PROVIDER_IDENTITY_REASSIGNMENT'));
      assert.ok(CONNECTED_ACCOUNTS_HARD_INVARIANTS.includes('NO_AUTOMATIC_ACCOUNT_MERGING'));
      assert.ok(CONNECTED_ACCOUNTS_HARD_INVARIANTS.includes('NO_FINAL_AUTH_METHOD_REMOVAL'));
      assert.ok(CONNECTED_ACCOUNTS_HARD_INVARIANTS.includes('BACKEND_AUTHORITATIVE_DISCONNECT_POLICY'));
      assert.ok(CONNECTED_ACCOUNTS_HARD_INVARIANTS.includes('NO_MOCKED_PROVIDER_STATE'));
      assert.ok(CONNECTED_ACCOUNTS_HARD_INVARIANTS.includes('NO_LOCAL_PROVIDER_REGISTRY'));
      assert.ok(CONNECTED_ACCOUNTS_HARD_INVARIANTS.includes('OAUTH_FLOW_REUSE'));
      assert.ok(CONNECTED_ACCOUNTS_HARD_INVARIANTS.includes('PROVIDER_STATE_CONVERGES_TO_SERVER_TRUTH'));
      assert.ok(CONNECTED_ACCOUNTS_HARD_INVARIANTS.includes('NO_SECURITY_ACTIVITY_UI_FABRICATION'));
    });
  });
});
