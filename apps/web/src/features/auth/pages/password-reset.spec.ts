import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  getPasswordStrength,
} from '../utils/validation.ts';
import { maskEmail } from '../utils/email.util.ts';
import { resolveAppRoute } from '../../../routes/routes.ts';

describe('AUTH-017: Forgot Password & Password Reset Architecture Contracts', () => {
  describe('Route Resolution Contracts', () => {
    it('resolves forgot-password routes correctly', () => {
      assert.equal(resolveAppRoute('/auth/forgot-password'), 'FORGOT_PASSWORD');
      assert.equal(resolveAppRoute('/forgot-password'), 'FORGOT_PASSWORD');
    });

    it('resolves reset-password routes correctly', () => {
      assert.equal(resolveAppRoute('/auth/reset-password'), 'RESET_PASSWORD');
      assert.equal(resolveAppRoute('/reset-password'), 'RESET_PASSWORD');
    });
  });

  describe('Forgot Password Email Validation & Anti-Enumeration Contracts', () => {
    it('accepts valid email addresses for reset link delivery', () => {
      assert.equal(validateEmail('swasthik@argonion.com'), undefined);
      assert.equal(validateEmail('user.name+tag@example.co.uk'), undefined);
    });

    it('rejects empty and malformed email addresses', () => {
      assert.ok(validateEmail(''));
      assert.ok(validateEmail('   '));
      assert.ok(validateEmail('invalid-email'));
      assert.ok(validateEmail('missing-domain@'));
      assert.ok(validateEmail('@missing-local.com'));
    });

    it('safely masks email addresses for anti-enumeration confirmation state', () => {
      assert.equal(maskEmail('swasthik@argonion.com'), 's*****k@argonion.com');
      assert.equal(maskEmail('john.doe@example.com'), 'j*****e@example.com');
    });
  });

  describe('Reset Password Policy & Confirmation Contracts', () => {
    it('accepts strong, high-entropy new passwords meeting canonical policy', () => {
      assert.equal(validatePassword('Nebula#2026!SecurePassword'), undefined);
      assert.equal(validatePassword('Correct-Horse-Battery-Staple-99'), undefined);
    });

    it('rejects weak and trivial passwords matching canonical policy restrictions', () => {
      assert.ok(validatePassword('12345678'));
      assert.ok(validatePassword('password123'));
      assert.ok(validatePassword('qwertyuiop'));
      assert.ok(validatePassword('aaaaaaaa'));
      assert.ok(validatePassword('short'));
    });

    it('calculates password entropy strength meter levels accurately', () => {
      assert.equal(getPasswordStrength('12345678'), 'weak');
      assert.equal(getPasswordStrength('GoodPass#99'), 'fair');
      assert.equal(getPasswordStrength('Nebula#2026!Enterprise!Production'), 'strong');
    });

    it('validates password confirmation exact match', () => {
      assert.equal(
        validateConfirmPassword('MySecurePass123!', 'MySecurePass123!'),
        undefined
      );
      assert.equal(
        validateConfirmPassword('mismatch123', 'MySecurePass123!'),
        'Passwords do not match.'
      );
      assert.equal(
        validateConfirmPassword('', 'MySecurePass123!'),
        'Please confirm your password.'
      );
    });
  });
});
