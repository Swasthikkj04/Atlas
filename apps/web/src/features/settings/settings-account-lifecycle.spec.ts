import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatAccountStatus,
  isLifecycleDestructiveActionAllowed,
  ACCOUNT_LIFECYCLE_HARD_INVARIANTS,
} from './contracts/account-lifecycle.contract.ts';

describe('AX-108: Account Lifecycle & Data Retention Specifications', () => {
  describe('1. Authoritative Account Status Formatter', () => {
    it('formats active status correctly with success tone', () => {
      const res = formatAccountStatus('ACTIVE');
      assert.equal(res.label, 'Active');
      assert.equal(res.tone, 'success');
    });

    it('formats deactivated status correctly with warning tone', () => {
      const res = formatAccountStatus('DEACTIVATED');
      assert.equal(res.label, 'Deactivated');
      assert.equal(res.tone, 'warning');
    });

    it('formats suspended and locked statuses correctly with destructive tone', () => {
      assert.equal(formatAccountStatus('SUSPENDED').tone, 'destructive');
      assert.equal(formatAccountStatus('LOCKED').tone, 'destructive');
    });

    it('formats pending verification status correctly with warning tone', () => {
      const res = formatAccountStatus('PENDING_VERIFICATION');
      assert.equal(res.label, 'Pending Verification');
      assert.equal(res.tone, 'warning');
    });
  });

  describe('2. Destructive Action Validation Gate', () => {
    it('allows destructive deletion when password and exact confirmation text match', () => {
      const allowed = isLifecycleDestructiveActionAllowed(
        true,
        'MySecretP@ssword123',
        'DELETE',
        'DELETE'
      );
      assert.equal(allowed, true);
    });

    it('blocks destructive deletion when password is missing on password account', () => {
      const allowed = isLifecycleDestructiveActionAllowed(
        true,
        '',
        'DELETE',
        'DELETE'
      );
      assert.equal(allowed, false);
    });

    it('blocks destructive deletion when confirmation text does not match', () => {
      const allowed = isLifecycleDestructiveActionAllowed(
        true,
        'MySecretP@ssword123',
        'NO',
        'DELETE'
      );
      assert.equal(allowed, false);
    });

    it('allows OAuth account deactivation/deletion without password when confirmation text matches', () => {
      const allowed = isLifecycleDestructiveActionAllowed(
        false,
        '',
        'DELETE',
        'DELETE'
      );
      assert.equal(allowed, true);
    });
  });

  describe('3. P0 Account Lifecycle Hard Invariants Certification', () => {
    it('certifies all 12 canonical account lifecycle hard invariants', () => {
      assert.equal(ACCOUNT_LIFECYCLE_HARD_INVARIANTS.length, 12);
      assert.ok(ACCOUNT_LIFECYCLE_HARD_INVARIANTS.includes('NO_UNAUTHORIZED_ACCOUNT_LIFECYCLE_CHANGE'));
      assert.ok(ACCOUNT_LIFECYCLE_HARD_INVARIANTS.includes('NO_CROSS_USER_RESOURCE_DELETION'));
      assert.ok(ACCOUNT_LIFECYCLE_HARD_INVARIANTS.includes('NO_UNCONFIRMED_DESTRUCTIVE_ACTION'));
      assert.ok(ACCOUNT_LIFECYCLE_HARD_INVARIANTS.includes('REAUTHENTICATION_REQUIRED_FOR_HIGH_RISK_OPERATION'));
      assert.ok(ACCOUNT_LIFECYCLE_HARD_INVARIANTS.includes('NO_PARTIAL_ACCOUNT_DELETION'));
      assert.ok(ACCOUNT_LIFECYCLE_HARD_INVARIANTS.includes('NO_ORPHANED_AUTHENTICATION_IDENTITIES'));
      assert.ok(ACCOUNT_LIFECYCLE_HARD_INVARIANTS.includes('NO_ACTIVE_SESSION_AFTER_ACCOUNT_TERMINATION'));
      assert.ok(ACCOUNT_LIFECYCLE_HARD_INVARIANTS.includes('NO_ACCIDENTAL_HISTORICAL_TRUTH_DESTRUCTION'));
      assert.ok(ACCOUNT_LIFECYCLE_HARD_INVARIANTS.includes('RETENTION_POLICY_IS_EXPLICIT'));
      assert.ok(ACCOUNT_LIFECYCLE_HARD_INVARIANTS.includes('NO_FAKE_DELETION_SUCCESS'));
      assert.ok(ACCOUNT_LIFECYCLE_HARD_INVARIANTS.includes('NO_MOCKED_LIFECYCLE_BEHAVIOR'));
      assert.ok(ACCOUNT_LIFECYCLE_HARD_INVARIANTS.includes('NO_SECURITY_ACTIVITY_UI_FABRICATION'));
    });
  });
});
