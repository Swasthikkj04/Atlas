import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'password1234',
  'password12345',
  'password123456',
  'pass1234',
  '12345678',
  '123456789',
  '1234567890',
  '87654321',
  '0987654321',
  'qwerty123',
  'qwerty1234',
  'qwertyui',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  'admin123',
  'admin1234',
  'administrator',
  'welcome',
  'welcome123',
  'welcome1234',
  'letmein',
  'letmein123',
  'iloveyou',
  'monkey123',
  'dragon123',
  'master123',
  'shadow123',
  'sunshine',
  'trustno1',
  'princess',
  'football',
  'baseball',
  'superman',
  'abcdefgh',
  'abcdefghi',
]);

const SEQUENTIAL_PATTERNS = [
  '01234567890',
  '98765432109',
  'abcdefghijklmnopqrstuvwxyz',
  'zyxwvutsrqponmlkjihgfedcba',
  'qwertyuiop',
  'poiuytrewq',
  'asdfghjkl',
  'lkjhgfdsa',
  'zxcvbnm',
  'mnbvcxz',
];

export class PasswordPolicy {
  static readonly MIN_LENGTH = 8;
  static readonly MAX_LENGTH = 128;

  static validate(password: string): PasswordValidationResult {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: 'Please enter a password.' };
    }

    if (password.length < this.MIN_LENGTH) {
      return {
        valid: false,
        error: `Password must be at least ${this.MIN_LENGTH} characters.`,
      };
    }

    if (password.length > this.MAX_LENGTH) {
      return {
        valid: false,
        error: `Password cannot exceed ${this.MAX_LENGTH} characters.`,
      };
    }

    const lower = password.toLowerCase();

    // 1. Common password dictionary detection
    if (COMMON_PASSWORDS.has(lower)) {
      return {
        valid: false,
        error: 'Password is too common. Choose a more unique password.',
      };
    }

    // Common predictable prefixes for short passwords (< 14 chars)
    if (
      password.length < 14 &&
      (lower.startsWith('password') ||
        lower.startsWith('admin') ||
        lower.startsWith('welcome') ||
        lower.startsWith('qwerty') ||
        lower.startsWith('letmein'))
    ) {
      return {
        valid: false,
        error: 'Password is too predictable. Choose a more unique password.',
      };
    }

    // 2. Repetitive characters pattern (e.g. "aaaa", "1111", or low entropy)
    if (/(.)\1{3,}/.test(password)) {
      return {
        valid: false,
        error: 'Password contains too many repeated characters.',
      };
    }

    const uniqueChars = new Set(password).size;
    if (password.length < 16 && uniqueChars < 4) {
      return {
        valid: false,
        error: 'Password contains too many repeated characters.',
      };
    }

    // 3. Sequential / Keyboard pattern walks (sequences of 4+ characters)
    for (const seq of SEQUENTIAL_PATTERNS) {
      for (let i = 0; i <= seq.length - 4; i++) {
        const sub = seq.substring(i, i + 4);
        if (lower.includes(sub)) {
          return {
            valid: false,
            error: 'Password contains an obvious sequential pattern.',
          };
        }
      }
    }

    // 4. Character diversity / complexity for passwords under 16 characters
    if (password.length < 16) {
      const hasNumber = /\d/.test(password);
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasSpecial = /[^a-zA-Z0-9]/.test(password);

      // Disallow pure numeric passwords
      if (/^\d+$/.test(password)) {
        return {
          valid: false,
          error: 'Password cannot consist solely of numbers.',
        };
      }

      // Disallow pure alphabetic single-case passwords without digits or symbols
      if (/^[a-zA-Z]+$/.test(password) && password.length < 12) {
        return {
          valid: false,
          error: 'Password must include a mix of letters, numbers, or symbols.',
        };
      }

      const categoriesCount =
        (hasNumber ? 1 : 0) + (hasLetter ? 1 : 0) + (hasSpecial ? 1 : 0);

      if (categoriesCount < 2) {
        return {
          valid: false,
          error: 'Password must include a mix of letters, numbers, or symbols.',
        };
      }
    }

    return { valid: true };
  }
}

/**
 * Class-validator decorator for DTO password fields
 */
export function IsStrongPasswordPolicy(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPasswordPolicy',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          return PasswordPolicy.validate(value).valid;
        },
        defaultMessage(args: ValidationArguments) {
          const result = PasswordPolicy.validate(args.value);
          return (
            result.error || 'Password does not meet security requirements.'
          );
        },
      },
    });
  };
}
