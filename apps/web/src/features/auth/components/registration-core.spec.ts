import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateRegistration,
  hasErrors,
  getPasswordStrength,
} from '../utils/validation.ts';
import { maskEmail } from '../utils/email.util.ts';

describe('AUTH-REF-001: Registration Core & CheckEmail Architecture Contracts', () => {
  describe('RegistrationForm Validation & Password Strength Contracts', () => {
    it('validates complete valid registration credentials accurately', () => {
      const validPayload = {
        fullName: 'Swasthik K J',
        email: 'swasthik@argonion.com',
        password: 'Nebula#2026!Atlas',
        confirmPassword: 'Nebula#2026!Atlas',
      };
      const errors = validateRegistration(validPayload);
      assert.strictEqual(hasErrors(errors), false);
    });

    it('rejects incomplete credentials with exact field error keys', () => {
      const invalidPayload = {
        fullName: '',
        email: 'invalid-email',
        password: '123',
        confirmPassword: '456',
      };
      const errors = validateRegistration(invalidPayload);
      assert.strictEqual(hasErrors(errors), true);
      assert.ok(errors.fullName);
      assert.ok(errors.email);
      assert.ok(errors.password);
      assert.ok(errors.confirmPassword);
    });

    it('accurately classifies password entropy levels for strength meter', () => {
      assert.strictEqual(getPasswordStrength('12345678'), 'weak');
      assert.strictEqual(getPasswordStrength('A!b@c#9$z%'), 'fair');
      assert.strictEqual(getPasswordStrength('Nebula#2026!Enterprise!Atlas'), 'strong');
    });

    it('enforces case-sensitive password confirmation matching', () => {
      const mismatch = validateRegistration({
        fullName: 'Swasthik',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'password123!',
      });
      assert.strictEqual(hasErrors(mismatch), true);
      assert.ok(mismatch.confirmPassword);
      assert.strictEqual(mismatch.confirmPassword, 'Passwords do not match.');
    });
  });

  describe('CheckEmailView Display & Privacy Contracts', () => {
    it('masks emails securely before user display', () => {
      assert.strictEqual(maskEmail('swasthik@argonion.com'), 's*****k@argonion.com');
      assert.strictEqual(maskEmail('alex@gmail.com'), 'a***x@gmail.com');
    });

    it('handles short and edge case addresses gracefully', () => {
      assert.strictEqual(maskEmail('a@b.com'), 'a*@b.com');
      assert.strictEqual(maskEmail(''), '');
    });
  });
});
