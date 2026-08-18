/**
 * Validation utilities for Create Workspace / Registration.
 * Enforces strict semantic parity with backend RegisterDto and AuthService PasswordPolicy.
 */

export interface RegistrationValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegistrationErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'strong';

/**
 * Standard RFC 5322 compatible email validation regex matching class-validator @IsEmail()
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Canonical dictionary of commonly used weak passwords.
 * Shared with backend PasswordPolicy.
 */
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

/**
 * Validates Full Name:
 * - Must be present and non-empty (whitespace-only rejected)
 * - Trimmed length must be >= 2 characters
 */
export function validateFullName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Please enter your full name.';
  }
  if (trimmed.length < 2) {
    return 'Your name must be at least 2 characters.';
  }
  return undefined;
}

/**
 * Validates Email:
 * - Must be present and non-empty
 * - Must match valid email structure (local-part@domain.tld)
 */
export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Please enter your email address.';
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid email address.';
  }
  return undefined;
}

/**
 * Validates Password:
 * - Must be present and non-empty
 * - Must be between 8 and 128 characters
 * - Evaluates entropy, patterns, sequences, and dictionary lists (Canonical Password Policy)
 * - Never trimmed or altered
 */
export function validatePassword(password: string): string | undefined {
  if (!password) {
    return 'Please enter a password.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (password.length > 128) {
    return 'Password cannot exceed 128 characters.';
  }

  const lower = password.toLowerCase();

  // 1. Common password dictionary detection
  if (COMMON_PASSWORDS.has(lower)) {
    return 'Password is too common. Choose a more unique password.';
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
    return 'Password is too predictable. Choose a more unique password.';
  }

  // 2. Repetitive characters pattern (e.g. "aaaa", "1111", or low entropy)
  if (/(.)\1{3,}/.test(password)) {
    return 'Password contains too many repeated characters.';
  }

  const uniqueChars = new Set(password).size;
  if (password.length < 16 && uniqueChars < 4) {
    return 'Password contains too many repeated characters.';
  }

  // 3. Sequential / Keyboard pattern walks (sequences of 4+ characters)
  for (const seq of SEQUENTIAL_PATTERNS) {
    for (let i = 0; i <= seq.length - 4; i++) {
      const sub = seq.substring(i, i + 4);
      if (lower.includes(sub)) {
        return 'Password contains an obvious sequential pattern.';
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
      return 'Password cannot consist solely of numbers.';
    }

    // Disallow pure alphabetic single-case passwords without digits or symbols
    if (/^[a-zA-Z]+$/.test(password) && password.length < 12) {
      return 'Password must include a mix of letters, numbers, or symbols.';
    }

    const categoriesCount =
      (hasNumber ? 1 : 0) + (hasLetter ? 1 : 0) + (hasSpecial ? 1 : 0);

    if (categoriesCount < 2) {
      return 'Password must include a mix of letters, numbers, or symbols.';
    }
  }

  return undefined;
}

/**
 * Calculates a calm, restrained password strength level based on canonical policy.
 */
export function getPasswordStrength(password: string): PasswordStrengthLevel {
  if (!password) return 'empty';
  const error = validatePassword(password);
  if (error) return 'weak';

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const diversity =
    (hasUpper ? 1 : 0) +
    (hasLower ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasSpecial ? 1 : 0);

  if (password.length >= 16 || (password.length >= 12 && diversity >= 3)) {
    return 'strong';
  }

  return 'fair';
}

/**
 * Validates Password Confirmation:
 * - Must be present
 * - Must match the exact password value
 */
export function validateConfirmPassword(
  confirmPassword: string,
  password: string
): string | undefined {
  if (!confirmPassword) {
    return 'Please confirm your password.';
  }
  if (confirmPassword !== password) {
    return 'Passwords do not match.';
  }
  return undefined;
}

/**
 * Validates all registration fields and returns any field-level error messages.
 */
export function validateRegistration(
  values: RegistrationValues
): RegistrationErrors {
  const errors: RegistrationErrors = {};

  const fullNameError = validateFullName(values.fullName);
  if (fullNameError) errors.fullName = fullNameError;

  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(values.password);
  if (passwordError) errors.password = passwordError;

  const confirmError = validateConfirmPassword(
    values.confirmPassword,
    values.password
  );
  if (confirmError) errors.confirmPassword = confirmError;

  return errors;
}

/**
 * Returns true if the given RegistrationErrors object contains any error messages.
 */
export function hasErrors(errors: RegistrationErrors): boolean {
  return Boolean(
    errors.fullName || errors.email || errors.password || errors.confirmPassword
  );
}
