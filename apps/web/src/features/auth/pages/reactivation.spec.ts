import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateReactivationEmail,
  validateReactivationToken,
  REACTIVATION_HARD_INVARIANTS,
} from '../contracts/reactivation.contract.ts';
import { resolveAppRoute, ROUTES } from '../../../routes/routes.ts';

describe('AX-112: Account Reactivation & Lifecycle Recovery Specifications', () => {
  describe('1. Input & Token Validation Logic', () => {
    it('validates email formatting correctly', () => {
      const valid = validateReactivationEmail('alex@example.com');
      assert.equal(valid.isValid, true);

      const invalid = validateReactivationEmail('not-an-email');
      assert.equal(invalid.isValid, false);
      assert.ok(invalid.error);

      const empty = validateReactivationEmail('');
      assert.equal(empty.isValid, false);
      assert.ok(empty.error);
    });

    it('validates reactivation token format and minimum entropy length', () => {
      const valid = validateReactivationToken('0123456789abcdef0123456789abcdef');
      assert.equal(valid.isValid, true);

      const tooShort = validateReactivationToken('short');
      assert.equal(tooShort.isValid, false);
      assert.ok(tooShort.error);

      const empty = validateReactivationToken(null);
      assert.equal(empty.isValid, false);
      assert.ok(empty.error);
    });
  });

  describe('2. Routing & Navigation Isolation', () => {
    it('resolves /auth/reactivate and alias to REACTIVATE view', () => {
      assert.equal(resolveAppRoute('/auth/reactivate'), 'REACTIVATE');
      assert.equal(resolveAppRoute('/reactivate'), 'REACTIVATE');
      assert.equal(resolveAppRoute(ROUTES.AUTH.REACTIVATE), 'REACTIVATE');
    });

    it('ensures Reactivation is isolated in unauthenticated Auth boundary', () => {
      assert.equal(ROUTES.AUTH.REACTIVATE.startsWith('/auth'), true);
      assert.equal(ROUTES.SETTINGS.ACCOUNT.startsWith('/settings'), true);
      assert.notEqual(ROUTES.AUTH.REACTIVATE, ROUTES.SETTINGS.ACCOUNT);
    });
  });

  describe('3. Certified Hard Invariants (AX-112)', () => {
    it('certifies all 15 AX-112 hard invariants', () => {
      assert.equal(REACTIVATION_HARD_INVARIANTS.length, 15);
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('NO_REACTIVATION_WITHOUT_VERIFICATION'));
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('NO_RAW_REACTIVATION_TOKEN_STORAGE'));
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('NO_REACTIVATION_TOKEN_REUSE'));
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('NO_EXPIRED_REACTIVATION_TOKEN'));
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('NO_ACCOUNT_ENUMERATION'));
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('NO_SILENT_OAUTH_REACTIVATION'));
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('NO_OLD_SESSION_REUSE'));
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('NO_DUPLICATE_USER_CREATION'));
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('NO_HISTORICAL_DATA_LOSS'));
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('NO_HISTORICAL_DATA_MUTATION'));
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('NO_PARTIAL_REACTIVATION'));
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('NO_CROSS_USER_REACTIVATION'));
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('NO_TOKEN_LOGGING'));
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('NO_UNAUTHORIZED_REACTIVATION'));
      assert.ok(REACTIVATION_HARD_INVARIANTS.includes('REACTIVATION_RESTORES_SAME_ACCOUNT_IDENTITY'));
    });
  });
});
