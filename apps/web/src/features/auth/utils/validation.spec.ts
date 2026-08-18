import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateRegistration,
  getPasswordStrength,
  hasErrors,
} from './validation.ts';

describe('AUTH-015: Strong Password Policy & Frontend Validation Parity', () => {
  describe('Full Name Validation (validateFullName)', () => {
    it('rejects empty string', () => {
      assert.equal(validateFullName(''), 'Please enter your full name.');
    });

    it('rejects whitespace-only string', () => {
      assert.equal(validateFullName('   '), 'Please enter your full name.');
      assert.equal(validateFullName('\t\n  '), 'Please enter your full name.');
    });

    it('rejects 1 character name (below minimum boundary of 2 characters)', () => {
      assert.equal(validateFullName('A'), 'Your name must be at least 2 characters.');
      assert.equal(validateFullName(' J '), 'Your name must be at least 2 characters.');
    });

    it('accepts exact 2 character name (minimum valid boundary)', () => {
      assert.equal(validateFullName('Al'), undefined);
      assert.equal(validateFullName('KJ'), undefined);
      assert.equal(validateFullName('  Bo  '), undefined);
    });

    it('accepts standard multi-word and unicode full names', () => {
      assert.equal(validateFullName('Swasthik Gowda'), undefined);
      assert.equal(validateFullName('Jane Doe-Smith'), undefined);
      assert.equal(validateFullName("O'Connor"), undefined);
      assert.equal(validateFullName('René Müller'), undefined);
    });
  });

  describe('Email Validation (validateEmail)', () => {
    it('rejects empty email', () => {
      assert.equal(validateEmail(''), 'Please enter your email address.');
      assert.equal(validateEmail('   '), 'Please enter your email address.');
    });

    it('rejects malformed email missing @ symbol', () => {
      assert.equal(validateEmail('plainaddress'), 'Please enter a valid email address.');
      assert.equal(validateEmail('swasthik.example.com'), 'Please enter a valid email address.');
    });

    it('rejects malformed email missing local part or domain', () => {
      assert.equal(validateEmail('@example.com'), 'Please enter a valid email address.');
      assert.equal(validateEmail('swasthik@'), 'Please enter a valid email address.');
      assert.equal(validateEmail('swasthik@.com'), 'Please enter a valid email address.');
    });

    it('rejects malformed email missing TLD', () => {
      assert.equal(validateEmail('swasthik@localhost'), 'Please enter a valid email address.');
      assert.equal(validateEmail('user@domain'), 'Please enter a valid email address.');
    });

    it('rejects email containing inner spaces', () => {
      assert.equal(validateEmail('swasthik @example.com'), 'Please enter a valid email address.');
      assert.equal(validateEmail('swasthik@ example.com'), 'Please enter a valid email address.');
    });

    it('accepts standard valid email addresses', () => {
      assert.equal(validateEmail('swasthik@example.com'), undefined);
      assert.equal(validateEmail('jane.doe@sub.company.org'), undefined);
      assert.equal(validateEmail('user+tag@domain.io'), undefined);
      assert.equal(validateEmail('swasthik_123@domain.co.uk'), undefined);
      assert.equal(validateEmail('  swasthik@example.com  '), undefined);
    });
  });

  describe('Password Policy Validation (validatePassword)', () => {
    it('rejects empty password', () => {
      assert.equal(validatePassword(''), 'Please enter a password.');
    });

    it('rejects passwords below 8 characters', () => {
      assert.equal(validatePassword('1234567'), 'Password must be at least 8 characters.');
      assert.equal(validatePassword('Str0ng!'), 'Password must be at least 8 characters.');
    });

    it('rejects obvious numeric-only passwords (e.g. 12345678, 123456789, 87654321)', () => {
      assert.ok(validatePassword('12345678'));
      assert.ok(validatePassword('123456789'));
      assert.ok(validatePassword('87654321'));
      assert.ok(validatePassword('9876543210'));
    });

    it('rejects common dictionary passwords (e.g. password, password123, qwerty123, admin123)', () => {
      assert.ok(validatePassword('password'));
      assert.ok(validatePassword('password123'));
      assert.ok(validatePassword('password1234'));
      assert.ok(validatePassword('admin123'));
      assert.ok(validatePassword('welcome'));
      assert.ok(validatePassword('letmein'));
      assert.ok(validatePassword('qwerty123'));
    });

    it('rejects repetitive character patterns (e.g. aaaaaaaa, 11111111, 11223344)', () => {
      assert.equal(
        validatePassword('aaaaaaaa'),
        'Password contains too many repeated characters.'
      );
      assert.equal(
        validatePassword('11111111'),
        'Password contains too many repeated characters.'
      );
      assert.ok(validatePassword('11223344'));
    });

    it('rejects sequential alphabet/keyboard patterns (e.g. cdefghij, poiuytre)', () => {
      assert.ok(validatePassword('abcdefgh'));
      assert.ok(validatePassword('qwertyui'));
      assert.equal(
        validatePassword('cdefghij'),
        'Password contains an obvious sequential pattern.'
      );
      assert.equal(
        validatePassword('poiuytre'),
        'Password contains an obvious sequential pattern.'
      );
    });

    it('rejects passwords exceeding 128 characters', () => {
      assert.equal(
        validatePassword('A'.repeat(129)),
        'Password cannot exceed 128 characters.'
      );
    });

    it('accepts strong, diverse passwords meeting canonical policy', () => {
      assert.equal(validatePassword('Nebula#2026!Atlas'), undefined);
      assert.equal(validatePassword('Atlas-Infra-Sec-99'), undefined);
      assert.equal(validatePassword('CorrectHorseBatteryStaple2026!'), undefined);
      assert.equal(validatePassword('k9#mP2$vL8@qW4!'), undefined);
      assert.equal(validatePassword('SecOps$Enterprise$2026'), undefined);
    });
  });

  describe('Password Strength Calculator (getPasswordStrength)', () => {
    it('returns empty for blank password', () => {
      assert.equal(getPasswordStrength(''), 'empty');
    });

    it('returns weak for passwords violating canonical policy', () => {
      assert.equal(getPasswordStrength('12345678'), 'weak');
      assert.equal(getPasswordStrength('password123'), 'weak');
      assert.equal(getPasswordStrength('short'), 'weak');
      assert.equal(getPasswordStrength('aaaaaaaa'), 'weak');
    });

    it('returns fair for valid basic passwords', () => {
      assert.equal(getPasswordStrength('K9#mP2$v'), 'fair'); // 8 chars valid
      assert.equal(getPasswordStrength('Atlas#2026'), 'fair'); // 10 chars, 3 categories
    });

    it('returns strong for high-entropy diverse passphrases', () => {
      assert.equal(getPasswordStrength('Nebula#2026!Atlas'), 'strong');
      assert.equal(getPasswordStrength('CorrectHorseBatteryStaple2026!'), 'strong');
      assert.equal(getPasswordStrength('SecOps$Enterprise$2026'), 'strong');
    });
  });

  describe('Password Confirmation (validateConfirmPassword)', () => {
    it('rejects empty confirm password', () => {
      assert.equal(
        validateConfirmPassword('', 'Nebula#2026!Atlas'),
        'Please confirm your password.'
      );
    });

    it('rejects mismatching confirm password', () => {
      assert.equal(
        validateConfirmPassword('WrongPassword123!', 'Nebula#2026!Atlas'),
        'Passwords do not match.'
      );
    });

    it('rejects case-sensitive mismatch', () => {
      assert.equal(
        validateConfirmPassword('nebula#2026!atlas', 'Nebula#2026!Atlas'),
        'Passwords do not match.'
      );
    });

    it('accepts exact matching confirm password', () => {
      assert.equal(
        validateConfirmPassword('Nebula#2026!Atlas', 'Nebula#2026!Atlas'),
        undefined
      );
    });
  });

  describe('Full Form Validation (validateRegistration & hasErrors)', () => {
    it('returns errors for all empty fields', () => {
      const errors = validateRegistration({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });

      assert.equal(errors.fullName, 'Please enter your full name.');
      assert.equal(errors.email, 'Please enter your email address.');
      assert.equal(errors.password, 'Please enter a password.');
      assert.equal(errors.confirmPassword, 'Please confirm your password.');
      assert.equal(hasErrors(errors), true);
    });

    it('returns empty errors object when all fields are valid', () => {
      const errors = validateRegistration({
        fullName: 'Swasthik K J',
        email: 'swasthik@example.com',
        password: 'Nebula#2026!Atlas',
        confirmPassword: 'Nebula#2026!Atlas',
      });

      assert.equal(errors.fullName, undefined);
      assert.equal(errors.email, undefined);
      assert.equal(errors.password, undefined);
      assert.equal(errors.confirmPassword, undefined);
      assert.equal(hasErrors(errors), false);
    });

    it('clears specific field errors immediately when corrected', () => {
      // 1. Initial invalid state
      let formState = {
        fullName: '',
        email: 'invalid-email',
        password: '12345678', // weak password
        confirmPassword: 'different-password',
      };

      let errors = validateRegistration(formState);
      assert.ok(errors.fullName);
      assert.ok(errors.email);
      assert.ok(errors.password);
      assert.ok(errors.confirmPassword);

      // 2. Correct full name
      formState = { ...formState, fullName: 'Swasthik K J' };
      errors = validateRegistration(formState);
      assert.equal(errors.fullName, undefined);
      assert.ok(errors.email);

      // 3. Correct email
      formState = { ...formState, email: 'swasthik@example.com' };
      errors = validateRegistration(formState);
      assert.equal(errors.email, undefined);
      assert.ok(errors.password);

      // 4. Correct password & confirm
      formState = {
        ...formState,
        password: 'Nebula#2026!Atlas',
        confirmPassword: 'Nebula#2026!Atlas',
      };
      errors = validateRegistration(formState);
      assert.equal(hasErrors(errors), false);
    });
  });
});
