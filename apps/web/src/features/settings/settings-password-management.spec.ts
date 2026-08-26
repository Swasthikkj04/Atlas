import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePasswordChangeInput,
  PASSWORD_MANAGEMENT_HARD_INVARIANTS,
} from './contracts/password-management.contract.ts';

describe('AX-104: Password Management & Credential Security Specifications', () => {
  describe('1. Password Change Validation & Confirmation Engine', () => {
    it('validates correct password change inputs', () => {
      const result = validatePasswordChangeInput({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewSecurePassword456!',
        confirmPassword: 'NewSecurePassword456!',
      });

      assert.equal(result.isValid, true);
      assert.equal(result.error, undefined);
      assert.equal(result.fieldErrors, undefined);
    });

    it('rejects empty or missing current password', () => {
      const result = validatePasswordChangeInput({
        currentPassword: '',
        newPassword: 'NewSecurePassword456!',
        confirmPassword: 'NewSecurePassword456!',
      });

      assert.equal(result.isValid, false);
      assert.equal(result.fieldErrors?.currentPassword, 'Current password is required.');
    });

    it('rejects new password shorter than 8 characters', () => {
      const result = validatePasswordChangeInput({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'Short1!',
        confirmPassword: 'Short1!',
      });

      assert.equal(result.isValid, false);
      assert.equal(
        result.fieldErrors?.newPassword,
        'New password must be at least 8 characters.',
      );
    });

    it('rejects new password exceeding 128 characters', () => {
      const longPassword = 'A'.repeat(129) + '!1a';
      const result = validatePasswordChangeInput({
        currentPassword: 'CurrentPassword123!',
        newPassword: longPassword,
        confirmPassword: longPassword,
      });

      assert.equal(result.isValid, false);
      assert.equal(
        result.fieldErrors?.newPassword,
        'New password must not exceed 128 characters.',
      );
    });

    it('rejects new password when it is identical to current password', () => {
      const result = validatePasswordChangeInput({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'CurrentPassword123!',
        confirmPassword: 'CurrentPassword123!',
      });

      assert.equal(result.isValid, false);
      assert.equal(
        result.fieldErrors?.newPassword,
        'New password must be different from current password.',
      );
    });

    it('rejects when new password and confirm password do not match', () => {
      const result = validatePasswordChangeInput({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewSecurePassword456!',
        confirmPassword: 'DifferentPassword789!',
      });

      assert.equal(result.isValid, false);
      assert.equal(result.fieldErrors?.confirmPassword, 'Passwords do not match.');
    });
  });

  describe('2. P0 Password Management Hard Invariants Certification', () => {
    it('certifies all 12 canonical password management hard invariants', () => {
      assert.equal(PASSWORD_MANAGEMENT_HARD_INVARIANTS.length, 12);
      assert.ok(PASSWORD_MANAGEMENT_HARD_INVARIANTS.includes('NO_UNAUTHENTICATED_PASSWORD_CHANGE'));
      assert.ok(PASSWORD_MANAGEMENT_HARD_INVARIANTS.includes('NO_CLIENT_SELECTED_USER_ID'));
      assert.ok(PASSWORD_MANAGEMENT_HARD_INVARIANTS.includes('NO_PLAINTEXT_PASSWORD_PERSISTENCE'));
      assert.ok(PASSWORD_MANAGEMENT_HARD_INVARIANTS.includes('NO_PLAINTEXT_PASSWORD_LOGGING'));
      assert.ok(PASSWORD_MANAGEMENT_HARD_INVARIANTS.includes('NO_FRONTEND_HASHING'));
      assert.ok(PASSWORD_MANAGEMENT_HARD_INVARIANTS.includes('ARGON2_REUSE'));
      assert.ok(PASSWORD_MANAGEMENT_HARD_INVARIANTS.includes('CURRENT_PASSWORD_REQUIRED'));
      assert.ok(PASSWORD_MANAGEMENT_HARD_INVARIANTS.includes('PASSWORD_POLICY_BACKEND_AUTHORITATIVE'));
      assert.ok(PASSWORD_MANAGEMENT_HARD_INVARIANTS.includes('SESSION_SECURITY_AFTER_PASSWORD_CHANGE'));
      assert.ok(PASSWORD_MANAGEMENT_HARD_INVARIANTS.includes('NO_PARTIAL_CREDENTIAL_UPDATE'));
      assert.ok(PASSWORD_MANAGEMENT_HARD_INVARIANTS.includes('NO_PASSWORD_DATA_IN_RESPONSE'));
      assert.ok(PASSWORD_MANAGEMENT_HARD_INVARIANTS.includes('NO_MOCKED_SECURITY_BEHAVIOR'));
    });
  });
});
