import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateProfileFullName,
  PROFILE_MANAGEMENT_HARD_INVARIANTS,
} from './contracts/profile-management.contract.ts';

describe('AX-103: Profile & Account Management Specifications', () => {
  describe('1. Full Name Validation & Sanitization Engine', () => {
    it('validates and sanitizes standard full name strings', () => {
      const result = validateProfileFullName('Swasthik K J');
      assert.equal(result.isValid, true);
      assert.equal(result.sanitizedFullName, 'Swasthik K J');
      assert.equal(result.error, undefined);
    });

    it('collapses multiple inner spaces and trims leading/trailing whitespace', () => {
      const result = validateProfileFullName('   Swasthik     Gowda   ');
      assert.equal(result.isValid, true);
      assert.equal(result.sanitizedFullName, 'Swasthik Gowda');
    });

    it('rejects empty or whitespace-only inputs', () => {
      const emptyResult = validateProfileFullName('');
      assert.equal(emptyResult.isValid, false);
      assert.equal(emptyResult.error, 'Full name cannot be empty.');

      const whitespaceResult = validateProfileFullName('    ');
      assert.equal(whitespaceResult.isValid, false);
      assert.equal(whitespaceResult.error, 'Full name cannot be empty.');
    });

    it('rejects names shorter than 2 characters', () => {
      const shortResult = validateProfileFullName('A');
      assert.equal(shortResult.isValid, false);
      assert.equal(shortResult.error, 'Full name must be at least 2 characters.');
    });

    it('rejects names exceeding 100 characters', () => {
      const oversizedName = 'A'.repeat(101);
      const longResult = validateProfileFullName(oversizedName);
      assert.equal(longResult.isValid, false);
      assert.equal(longResult.error, 'Full name must not exceed 100 characters.');
    });

    it('rejects non-string types safely', () => {
      assert.equal(validateProfileFullName(null).isValid, false);
      assert.equal(validateProfileFullName(undefined).isValid, false);
      assert.equal(validateProfileFullName(12345).isValid, false);
      assert.equal(validateProfileFullName({}).isValid, false);
    });
  });

  describe('2. P0 Profile Management Hard Invariants Certification', () => {
    it('certifies all 10 canonical profile management hard invariants', () => {
      assert.equal(PROFILE_MANAGEMENT_HARD_INVARIANTS.length, 10);
      assert.ok(PROFILE_MANAGEMENT_HARD_INVARIANTS.includes('NO_UNAUTHORIZED_PROFILE_MUTATION'));
      assert.ok(PROFILE_MANAGEMENT_HARD_INVARIANTS.includes('NO_MASS_ASSIGNMENT_PROFILE_UPDATE'));
      assert.ok(PROFILE_MANAGEMENT_HARD_INVARIANTS.includes('NO_EMAIL_CHANGE_WITHOUT_VERIFICATION'));
      assert.ok(PROFILE_MANAGEMENT_HARD_INVARIANTS.includes('NO_ACCOUNT_STATUS_MUTATION_FROM_PROFILE'));
      assert.ok(PROFILE_MANAGEMENT_HARD_INVARIANTS.includes('NO_MOCKED_PROFILE_DATA'));
      assert.ok(PROFILE_MANAGEMENT_HARD_INVARIANTS.includes('NO_FRONTEND_ONLY_PROFILE_STATE'));
      assert.ok(PROFILE_MANAGEMENT_HARD_INVARIANTS.includes('NO_STALE_WORKSPACE_IDENTITY_AFTER_UPDATE'));
      assert.ok(PROFILE_MANAGEMENT_HARD_INVARIANTS.includes('NO_SENSITIVE_FIELD_EXPOSURE'));
      assert.ok(PROFILE_MANAGEMENT_HARD_INVARIANTS.includes('NO_UNAUTHENTICATED_PROFILE_UPDATE'));
      assert.ok(PROFILE_MANAGEMENT_HARD_INVARIANTS.includes('NO_BROKEN_SETTINGS_ACCOUNT_ROUTE'));
    });
  });
});
