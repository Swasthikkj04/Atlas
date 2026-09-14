import 'reflect-metadata';
import { validateEnvironment, Environment } from './env.validation';

describe('REFINEMENT-003: Environment Validation & Production Configuration Hardening', () => {
  const validProductionBase = {
    NODE_ENV: Environment.Production,
    PORT: 3000,
    DATABASE_URL:
      'postgresql://atlas_prod_user:StrongProdPass_9988@db.prod.internal:5432/atlas_prod',
    JWT_ACCESS_SECRET:
      'prod_super_secure_access_secret_key_minimum_32_characters_long_12345!',
    JWT_REFRESH_SECRET:
      'prod_super_secure_refresh_secret_key_minimum_32_characters_long_67890!',
    FRONTEND_URL: 'https://app.argonion.com',
    APP_URL: 'https://app.argonion.com',
    CORS_ALLOWED_ORIGINS:
      'https://app.argonion.com,https://www.argonion.com,https://argonion.com',
    EMAIL_PROVIDER: 'smtp',
    EMAIL_FROM: 'security@argonion.com',
    SMTP_HOST: 'smtp.sendgrid.net',
    SMTP_PORT: 587,
    SMTP_USER: 'apikey',
    SMTP_PASS: 'SG.super_secure_production_smtp_password_key',
    GOOGLE_OAUTH_ENABLED: 'false',
    GITHUB_OAUTH_ENABLED: 'false',
  };

  describe('1. Development & Test Environment Defaults', () => {
    it('should safely provide development defaults when variables are omitted in development mode', () => {
      const result = validateEnvironment({
        NODE_ENV: 'development',
      });

      expect(result.NODE_ENV).toBe(Environment.Development);
      expect(result.PORT).toBe(3000);
      expect(result.DATABASE_URL).toBe(
        'postgresql://atlas:atlas@localhost:5432/atlas',
      );
      expect(result.JWT_ACCESS_SECRET).toBe('atlas-development-access-secret');
      expect(result.JWT_REFRESH_SECRET).toBe(
        'atlas-development-refresh-secret',
      );
      expect(result.FRONTEND_URL).toBe('http://localhost:5173');
      expect(result.EMAIL_PROVIDER).toBe('development');
    });

    it('should safely validate test mode configuration', () => {
      const result = validateEnvironment({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/atlas_test',
      });

      expect(result.NODE_ENV).toBe(Environment.Test);
      expect(result.DATABASE_URL).toBe(
        'postgresql://test:test@localhost:5432/atlas_test',
      );
    });
  });

  describe('2. Valid Production Configuration', () => {
    it('should succeed when all production invariants are fully satisfied', () => {
      const result = validateEnvironment(validProductionBase);

      expect(result.NODE_ENV).toBe(Environment.Production);
      expect(result.JWT_ACCESS_SECRET).toBe(
        validProductionBase.JWT_ACCESS_SECRET,
      );
      expect(result.JWT_REFRESH_SECRET).toBe(
        validProductionBase.JWT_REFRESH_SECRET,
      );
      expect(result.DATABASE_URL).toBe(validProductionBase.DATABASE_URL);
    });
  });

  describe('3. Production JWT Secret Fail-Fast Invariants', () => {
    it('should reject production startup if JWT_ACCESS_SECRET is missing', () => {
      const config = { ...validProductionBase };
      delete (config as any).JWT_ACCESS_SECRET;

      expect(() => validateEnvironment(config)).toThrow(
        /JWT_ACCESS_SECRET is mandatory in production/,
      );
    });

    it('should reject production startup if JWT_ACCESS_SECRET matches known dev fallback', () => {
      const config = {
        ...validProductionBase,
        JWT_ACCESS_SECRET: 'atlas-development-access-secret',
      };

      expect(() => validateEnvironment(config)).toThrow(
        /JWT_ACCESS_SECRET is weak, too short \(< 32 chars\), or matches development placeholder values/,
      );
    });

    it('should reject production startup if JWT_ACCESS_SECRET is too short (<32 chars)', () => {
      const config = {
        ...validProductionBase,
        JWT_ACCESS_SECRET: 'short_secret_under_32_chars',
      };

      expect(() => validateEnvironment(config)).toThrow(
        /JWT_ACCESS_SECRET is weak, too short/,
      );
    });

    it('should reject production startup if JWT_ACCESS_SECRET is a common placeholder', () => {
      const config = {
        ...validProductionBase,
        JWT_ACCESS_SECRET: 'your-jwt-secret-placeholder-key-value-1234567890',
      };

      expect(() => validateEnvironment(config)).toThrow(
        /matches development placeholder values/,
      );
    });

    it('should reject production startup if JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are identical', () => {
      const secret =
        'same_cryptographic_secret_key_used_for_both_tokens_32chars!';
      const config = {
        ...validProductionBase,
        JWT_ACCESS_SECRET: secret,
        JWT_REFRESH_SECRET: secret,
      };

      expect(() => validateEnvironment(config)).toThrow(
        /JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be distinct cryptographic keys/,
      );
    });
  });

  describe('4. Production Database Configuration Invariants', () => {
    it('should reject production startup if DATABASE_URL points to localhost', () => {
      const config = {
        ...validProductionBase,
        DATABASE_URL:
          'postgresql://atlas:secure_pass@localhost:5432/atlas_prod',
      };

      expect(() => validateEnvironment(config)).toThrow(
        /DATABASE_URL in production must not point to localhost/,
      );
    });

    it('should reject production startup if DATABASE_URL contains default development credentials', () => {
      const config = {
        ...validProductionBase,
        DATABASE_URL:
          'postgresql://atlas:atlas@db.prod.internal:5432/atlas_prod',
      };

      expect(() => validateEnvironment(config)).toThrow(
        /DATABASE_URL contains default\/example development credentials/,
      );
    });
  });

  describe('5. Production Application & Frontend URL Invariants', () => {
    it('should reject production startup if FRONTEND_URL points to localhost', () => {
      const config = {
        ...validProductionBase,
        FRONTEND_URL: 'http://localhost:5173',
      };

      expect(() => validateEnvironment(config)).toThrow(
        /FRONTEND_URL in production must not point to localhost/,
      );
    });

    it('should reject production startup if APP_URL points to 127.0.0.1', () => {
      const config = {
        ...validProductionBase,
        APP_URL: 'http://127.0.0.1:3000',
      };

      expect(() => validateEnvironment(config)).toThrow(
        /APP_URL in production must not point to localhost/,
      );
    });
  });

  describe('6. Production CORS Invariants', () => {
    it('should reject production startup if CORS_ALLOWED_ORIGINS contains wildcard (*)', () => {
      const config = {
        ...validProductionBase,
        CORS_ALLOWED_ORIGINS: '*',
      };

      expect(() => validateEnvironment(config)).toThrow(
        /Wildcard CORS origin \(\*\) is forbidden in production/,
      );
    });

    it('should reject production startup if CORS_ALLOWED_ORIGINS contains localhost', () => {
      const config = {
        ...validProductionBase,
        CORS_ALLOWED_ORIGINS: 'https://app.argonion.com,http://localhost:5173',
      };

      expect(() => validateEnvironment(config)).toThrow(
        /CORS_ALLOWED_ORIGINS in production must not include localhost/,
      );
    });
  });

  describe('7. Production Email Provider Invariants', () => {
    it('should reject production startup if EMAIL_PROVIDER=development or mailpit', () => {
      const config = {
        ...validProductionBase,
        EMAIL_PROVIDER: 'development',
      };

      expect(() => validateEnvironment(config)).toThrow(
        /EMAIL_PROVIDER cannot be development\/mailpit in production/,
      );
    });

    it('should reject production startup if EMAIL_PROVIDER=smtp but SMTP_HOST points to localhost', () => {
      const config = {
        ...validProductionBase,
        EMAIL_PROVIDER: 'smtp',
        SMTP_HOST: 'localhost',
      };

      expect(() => validateEnvironment(config)).toThrow(
        /SMTP_HOST in production must not point to localhost/,
      );
    });

    it('should reject production startup if EMAIL_FROM uses example.com', () => {
      const config = {
        ...validProductionBase,
        EMAIL_FROM: 'no-reply@example.com',
      };

      expect(() => validateEnvironment(config)).toThrow(
        /EMAIL_FROM cannot use example\.com or localhost domain in production/,
      );
    });

    it('should succeed in production when EMAIL_PROVIDER=resend and valid RESEND_API_KEY is provided', () => {
      const config = {
        ...validProductionBase,
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 're_1234567890abcdef1234567890abcdef',
      };
      delete (config as any).SMTP_HOST;
      delete (config as any).SMTP_PORT;
      delete (config as any).SMTP_USER;
      delete (config as any).SMTP_PASS;

      const result = validateEnvironment(config);
      expect(result.EMAIL_PROVIDER).toBe('resend');
      expect(result.RESEND_API_KEY).toBe('re_1234567890abcdef1234567890abcdef');
    });

    it('should reject production startup if EMAIL_PROVIDER=resend and RESEND_API_KEY is missing', () => {
      const config = {
        ...validProductionBase,
        EMAIL_PROVIDER: 'resend',
      };
      delete (config as any).SMTP_HOST;
      delete (config as any).SMTP_PORT;
      delete (config as any).SMTP_USER;
      delete (config as any).SMTP_PASS;
      delete (config as any).RESEND_API_KEY;

      expect(() => validateEnvironment(config)).toThrow(
        /RESEND_API_KEY is required and must not be a placeholder when EMAIL_PROVIDER=resend in production/,
      );
    });

    it('should reject production startup if EMAIL_PROVIDER=resend and RESEND_API_KEY contains placeholder', () => {
      const config = {
        ...validProductionBase,
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 're_placeholder_secret_key_1234567890!',
      };
      delete (config as any).SMTP_HOST;
      delete (config as any).SMTP_PORT;
      delete (config as any).SMTP_USER;
      delete (config as any).SMTP_PASS;

      expect(() => validateEnvironment(config)).toThrow(
        /RESEND_API_KEY is required and must not be a placeholder when EMAIL_PROVIDER=resend in production/,
      );
    });

    it('should reject production startup if EMAIL_PROVIDER=resend and RESEND_API_KEY is too short (< 32 chars)', () => {
      const config = {
        ...validProductionBase,
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 're_short_secret_key_1234',
      };
      delete (config as any).SMTP_HOST;
      delete (config as any).SMTP_PORT;
      delete (config as any).SMTP_USER;
      delete (config as any).SMTP_PASS;

      expect(() => validateEnvironment(config)).toThrow(
        /RESEND_API_KEY is required and must not be a placeholder when EMAIL_PROVIDER=resend in production/,
      );
    });

    it('should not require RESEND_API_KEY when another production provider (e.g. smtp) is active', () => {
      const config = {
        ...validProductionBase,
        EMAIL_PROVIDER: 'smtp',
      };
      delete (config as any).RESEND_API_KEY;

      const result = validateEnvironment(config);
      expect(result.EMAIL_PROVIDER).toBe('smtp');
      expect(result.RESEND_API_KEY).toBeUndefined();
    });

    it('should allow development mode without RESEND_API_KEY when EMAIL_PROVIDER=development', () => {
      const result = validateEnvironment({
        NODE_ENV: 'development',
        EMAIL_PROVIDER: 'development',
      });
      expect(result.EMAIL_PROVIDER).toBe('development');
      expect(result.RESEND_API_KEY).toBeUndefined();
    });
  });

  describe('8. Production OAuth Invariants', () => {
    it('should allow disabled OAuth providers without requiring client credentials', () => {
      const config = {
        ...validProductionBase,
        GOOGLE_OAUTH_ENABLED: 'false',
        GITHUB_OAUTH_ENABLED: 'false',
      };

      const result = validateEnvironment(config);
      expect(result.GOOGLE_OAUTH_ENABLED).toBe('false');
      expect(result.GITHUB_OAUTH_ENABLED).toBe('false');
    });

    it('should reject production startup if Google OAuth is enabled but secret contains placeholder', () => {
      const config = {
        ...validProductionBase,
        GOOGLE_OAUTH_ENABLED: 'true',
        GOOGLE_CLIENT_ID: '123456789.apps.googleusercontent.com',
        GOOGLE_CLIENT_SECRET: 'google-client-secret-placeholder',
        GOOGLE_CALLBACK_URL:
          'https://api.argonion.com/api/v1/auth/google/callback',
      };

      expect(() => validateEnvironment(config)).toThrow(
        /GOOGLE_CLIENT_SECRET is missing or contains placeholder values/,
      );
    });

    it('should reject production startup if GitHub OAuth is enabled but callback URL points to localhost', () => {
      const config = {
        ...validProductionBase,
        GITHUB_OAUTH_ENABLED: 'true',
        GITHUB_CLIENT_ID: 'Ov23liYVfSzeaPnhvcjz_prod_real_client_id_1234',
        GITHUB_CLIENT_SECRET:
          '41ecbc57b643bdd4ca7c34e622b08fedae3bf7a7_real_secret',
        GITHUB_CALLBACK_URL:
          'http://localhost:3000/api/v1/auth/github/callback',
      };

      expect(() => validateEnvironment(config)).toThrow(
        /GITHUB_CALLBACK_URL in production must not point to localhost/,
      );
    });
  });
});
