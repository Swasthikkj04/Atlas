import { validate } from 'class-validator';
import {
  PasswordPolicy,
  IsStrongPasswordPolicy,
} from './password-policy.validator';
import { RegisterDto } from '../dto/register.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

describe('AUTH-015: Canonical Password Policy (Backend Validator)', () => {
  describe('PasswordPolicy.validate', () => {
    describe('Obvious Common & Predictable Passwords (REJECT)', () => {
      const commonPasswords = [
        'password',
        'password123',
        'password1234',
        'admin123',
        'welcome',
        'welcome123',
        'letmein',
        'qwerty123',
        'qwertyui',
        '12345678',
        '123456789',
        '87654321',
        '0987654321',
        'abcdefgh',
        'abcdefghi',
        'aaaaaaaa',
        '11111111',
        '11223344',
      ];

      it.each(commonPasswords)('rejects common/weak password: "%s"', (pw) => {
        const result = PasswordPolicy.validate(pw);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('Length Boundaries', () => {
      it('rejects empty password', () => {
        const result = PasswordPolicy.validate('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Please enter a password.');
      });

      it('rejects password with length < 8 (e.g. 7 characters)', () => {
        const result = PasswordPolicy.validate('Str0ng!');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Password must be at least 8 characters.');
      });

      it('accepts valid password at exact minimum length boundary of 8 characters', () => {
        const result = PasswordPolicy.validate('K9#mP2$v');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('accepts valid password at exact maximum length boundary of 128 characters', () => {
        const longPw = 'Nebula#2026!AtlasPolicy$SecOps'.repeat(4) + '#99!'; // 31*4 + 4 = 128 chars
        const result = PasswordPolicy.validate(longPw);
        expect(result.valid).toBe(true);
      });

      it('rejects password exceeding maximum length of 128 characters', () => {
        const tooLong = 'A'.repeat(129);
        const result = PasswordPolicy.validate(tooLong);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Password cannot exceed 128 characters.');
      });
    });

    describe('Strong Passwords (ACCEPT)', () => {
      const strongPasswords = [
        'Nebula#2026!Atlas',
        'Atlas-Infra-Sec-99',
        'CorrectHorseBatteryStaple2026!',
        'k9#mP2$vL8@qW4!',
        'SecOps$Enterprise$2026',
      ];

      it.each(strongPasswords)('accepts strong password: "%s"', (pw) => {
        const result = PasswordPolicy.validate(pw);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });
  });

  describe('DTO Class-Validator Integration', () => {
    it('rejects RegisterDto with weak password "12345678"', async () => {
      const dto = new RegisterDto();
      dto.fullName = 'Swasthik K J';
      dto.email = 'swasthik@example.com';
      dto.password = '12345678';
      dto.confirmPassword = '12345678';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
    });

    it('accepts RegisterDto with strong password', async () => {
      const dto = new RegisterDto();
      dto.fullName = 'Swasthik K J';
      dto.email = 'swasthik@example.com';
      dto.password = 'Nebula#2026!Atlas';
      dto.confirmPassword = 'Nebula#2026!Atlas';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('rejects ResetPasswordDto with weak password "password123"', async () => {
      const dto = new ResetPasswordDto();
      dto.token = 'valid-token-uuid-123';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
    });

    it('accepts ResetPasswordDto with strong password', async () => {
      const dto = new ResetPasswordDto();
      dto.token = 'valid-token-uuid-123';
      dto.password = 'Atlas-Infra-Sec-99';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
