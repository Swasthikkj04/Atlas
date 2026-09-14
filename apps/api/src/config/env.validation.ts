import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Test = 'test',
  Testing = 'testing',
  Staging = 'staging',
  Production = 'production',
}

const EXACT_WEAK_SECRETS = new Set([
  'secret',
  'changeme',
  'password',
  'admin',
  '12345678',
  'test',
  'development',
]);

const INSECURE_SECRET_SUBSTRINGS = [
  'atlas-development-access-secret',
  'atlas-development-refresh-secret',
  'atlas-secure-development-secret-key-1234567890!',
  'development-secret',
  'your-jwt-secret',
  'your-secret-here',
  'test-secret',
  'placeholder',
  'example',
];

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_SECRET?: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_SECRET?: string;

  @IsString()
  @IsOptional()
  JWT_SECRET?: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  APP_URL?: string;

  @IsString()
  @IsOptional()
  FRONTEND_URL?: string;

  @IsString()
  @IsOptional()
  CORS_ALLOWED_ORIGINS?: string;

  @IsString()
  @IsOptional()
  EMAIL_PROVIDER?: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM?: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM_NAME?: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM_ADDRESS?: string;

  @IsString()
  @IsOptional()
  EMAIL_REPLY_TO?: string;

  @IsString()
  @IsOptional()
  NEBULA_APP_URL?: string;

  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsOptional()
  SMTP_PORT?: number;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASS?: string;

  @IsString()
  @IsOptional()
  RESEND_API_KEY?: string;

  @IsString()
  @IsOptional()
  GOOGLE_OAUTH_ENABLED?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CALLBACK_URL?: string;

  @IsString()
  @IsOptional()
  GITHUB_OAUTH_ENABLED?: string;

  @IsString()
  @IsOptional()
  GITHUB_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GITHUB_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  GITHUB_CALLBACK_URL?: string;

  @IsString()
  @IsOptional()
  RATE_LIMIT_ENABLED: string = 'true';

  @IsInt()
  @Min(1)
  @IsOptional()
  RATE_LIMIT_GLOBAL: number = 120;

  @IsInt()
  @Min(1)
  @IsOptional()
  RATE_LIMIT_WINDOW: number = 60;
}

function isWeakOrPlaceholderSecret(val: string): boolean {
  if (!val || val.trim().length < 32) return true;
  const lower = val.toLowerCase().trim();
  if (EXACT_WEAK_SECRETS.has(lower)) return true;
  return INSECURE_SECRET_SUBSTRINGS.some((sub) => lower.includes(sub));
}

function containsLocalhost(val?: string): boolean {
  if (!val) return false;
  const lower = val.toLowerCase();
  return (
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('0.0.0.0')
  );
}

export function validateEnvironment(config: Record<string, unknown>) {
  const nodeEnv = (
    (config.NODE_ENV as string) || Environment.Development
  ).toLowerCase() as Environment;
  const isProduction = nodeEnv === Environment.Production;
  const isTestOrDev =
    nodeEnv === Environment.Development ||
    nodeEnv === Environment.Test ||
    nodeEnv === Environment.Testing;

  const rawConfig = { ...config };

  // In development / test, provide safe defaults where missing
  if (isTestOrDev) {
    if (!rawConfig.DATABASE_URL) {
      rawConfig.DATABASE_URL = 'postgresql://atlas:atlas@localhost:5432/atlas';
    }
    if (!rawConfig.JWT_ACCESS_SECRET) {
      rawConfig.JWT_ACCESS_SECRET = 'atlas-development-access-secret';
    }
    if (!rawConfig.JWT_REFRESH_SECRET) {
      rawConfig.JWT_REFRESH_SECRET = 'atlas-development-refresh-secret';
    }
    if (!rawConfig.JWT_SECRET) {
      rawConfig.JWT_SECRET = 'atlas-secure-development-secret-key-1234567890!';
    }
    if (!rawConfig.FRONTEND_URL) {
      rawConfig.FRONTEND_URL = 'http://localhost:5173';
    }
    if (!rawConfig.APP_URL) {
      rawConfig.APP_URL = 'http://localhost:5173';
    }
    if (!rawConfig.EMAIL_PROVIDER) {
      rawConfig.EMAIL_PROVIDER = 'development';
    }
    if (!rawConfig.EMAIL_FROM) {
      rawConfig.EMAIL_FROM = 'no-reply@argonion.com';
    }
    if (!rawConfig.EMAIL_FROM_NAME) {
      rawConfig.EMAIL_FROM_NAME = 'Swasthik K J';
    }
    if (!rawConfig.EMAIL_FROM_ADDRESS) {
      rawConfig.EMAIL_FROM_ADDRESS = 'swasthik@argonion.com';
    }
    if (!rawConfig.EMAIL_REPLY_TO) {
      rawConfig.EMAIL_REPLY_TO = 'support@argonion.com';
    }
  }

  const validatedConfig = plainToInstance(EnvironmentVariables, rawConfig, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  const securityViolations: string[] = [];

  if (errors.length > 0) {
    errors.forEach((err) => {
      securityViolations.push(
        ...Object.values(err.constraints || {}).map(
          (c) => `${err.property}: ${c}`,
        ),
      );
    });
  }

  // Strict Production Validations
  if (isProduction) {
    // 1. Database URL Validation
    if (!validatedConfig.DATABASE_URL) {
      securityViolations.push('DATABASE_URL must be provided in production.');
    } else {
      if (
        !validatedConfig.DATABASE_URL.startsWith('postgresql://') &&
        !validatedConfig.DATABASE_URL.startsWith('postgres://')
      ) {
        securityViolations.push(
          'DATABASE_URL must be a valid PostgreSQL connection string.',
        );
      }
      if (containsLocalhost(validatedConfig.DATABASE_URL)) {
        securityViolations.push(
          'DATABASE_URL in production must not point to localhost / 127.0.0.1.',
        );
      }
      if (
        validatedConfig.DATABASE_URL.includes('user:password') ||
        validatedConfig.DATABASE_URL.includes('atlas:atlas') ||
        validatedConfig.DATABASE_URL.includes('postgres:postgres@')
      ) {
        securityViolations.push(
          'DATABASE_URL contains default/example development credentials.',
        );
      }
    }

    // 2. JWT Access & Refresh Secret Validation
    if (!validatedConfig.JWT_ACCESS_SECRET) {
      securityViolations.push('JWT_ACCESS_SECRET is mandatory in production.');
    } else if (isWeakOrPlaceholderSecret(validatedConfig.JWT_ACCESS_SECRET)) {
      securityViolations.push(
        'JWT_ACCESS_SECRET is weak, too short (< 32 chars), or matches development placeholder values.',
      );
    }

    if (!validatedConfig.JWT_REFRESH_SECRET) {
      securityViolations.push('JWT_REFRESH_SECRET is mandatory in production.');
    } else if (isWeakOrPlaceholderSecret(validatedConfig.JWT_REFRESH_SECRET)) {
      securityViolations.push(
        'JWT_REFRESH_SECRET is weak, too short (< 32 chars), or matches development placeholder values.',
      );
    }

    if (
      validatedConfig.JWT_ACCESS_SECRET &&
      validatedConfig.JWT_REFRESH_SECRET &&
      validatedConfig.JWT_ACCESS_SECRET === validatedConfig.JWT_REFRESH_SECRET
    ) {
      securityViolations.push(
        'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be distinct cryptographic keys.',
      );
    }

    // 3. Application & Frontend URLs
    if (!validatedConfig.FRONTEND_URL) {
      securityViolations.push('FRONTEND_URL is mandatory in production.');
    } else if (containsLocalhost(validatedConfig.FRONTEND_URL)) {
      securityViolations.push(
        'FRONTEND_URL in production must not point to localhost / 127.0.0.1.',
      );
    }

    if (validatedConfig.APP_URL && containsLocalhost(validatedConfig.APP_URL)) {
      securityViolations.push(
        'APP_URL in production must not point to localhost / 127.0.0.1.',
      );
    }

    // 4. CORS Allowed Origins
    if (validatedConfig.CORS_ALLOWED_ORIGINS) {
      if (validatedConfig.CORS_ALLOWED_ORIGINS.includes('*')) {
        securityViolations.push(
          'Wildcard CORS origin (*) is forbidden in production with credentials.',
        );
      }
      if (containsLocalhost(validatedConfig.CORS_ALLOWED_ORIGINS)) {
        securityViolations.push(
          'CORS_ALLOWED_ORIGINS in production must not include localhost / 127.0.0.1.',
        );
      }
    }

    // 5. Email Configuration
    const emailProvider = (validatedConfig.EMAIL_PROVIDER || '').toLowerCase();
    if (
      emailProvider === 'development' ||
      emailProvider === 'mailpit' ||
      !emailProvider
    ) {
      securityViolations.push(
        'EMAIL_PROVIDER cannot be development/mailpit in production. Configure a production provider (e.g. smtp, ses, sendgrid, resend, postmark).',
      );
    }

    if (emailProvider === 'smtp') {
      if (!validatedConfig.SMTP_HOST) {
        securityViolations.push(
          'SMTP_HOST must be provided when EMAIL_PROVIDER=smtp.',
        );
      } else if (containsLocalhost(validatedConfig.SMTP_HOST)) {
        securityViolations.push(
          'SMTP_HOST in production must not point to localhost / 127.0.0.1.',
        );
      }
      if (!validatedConfig.SMTP_USER || !validatedConfig.SMTP_PASS) {
        securityViolations.push(
          'SMTP_USER and SMTP_PASS are required when EMAIL_PROVIDER=smtp.',
        );
      }
    }

    if (emailProvider === 'resend') {
      if (
        !validatedConfig.RESEND_API_KEY ||
        isWeakOrPlaceholderSecret(validatedConfig.RESEND_API_KEY)
      ) {
        securityViolations.push(
          'RESEND_API_KEY is required and must not be a placeholder when EMAIL_PROVIDER=resend in production.',
        );
      }
    }

    if (
      validatedConfig.EMAIL_FROM &&
      (validatedConfig.EMAIL_FROM.includes('example.com') ||
        validatedConfig.EMAIL_FROM.includes('localhost'))
    ) {
      securityViolations.push(
        'EMAIL_FROM cannot use example.com or localhost domain in production.',
      );
    }

    if (
      validatedConfig.EMAIL_FROM_ADDRESS &&
      (validatedConfig.EMAIL_FROM_ADDRESS.includes('example.com') ||
        validatedConfig.EMAIL_FROM_ADDRESS.includes('localhost'))
    ) {
      securityViolations.push(
        'EMAIL_FROM_ADDRESS cannot use example.com or localhost domain in production.',
      );
    }

    // 6. OAuth Providers
    const isGoogleOAuthEnabled =
      validatedConfig.GOOGLE_OAUTH_ENABLED === 'true' ||
      Boolean(
        validatedConfig.GOOGLE_CLIENT_ID &&
        !validatedConfig.GOOGLE_CLIENT_ID.includes('placeholder'),
      );

    if (isGoogleOAuthEnabled) {
      if (
        !validatedConfig.GOOGLE_CLIENT_ID ||
        isWeakOrPlaceholderSecret(validatedConfig.GOOGLE_CLIENT_ID)
      ) {
        securityViolations.push(
          'GOOGLE_CLIENT_ID is missing or contains placeholder values while Google OAuth is enabled.',
        );
      }
      if (
        !validatedConfig.GOOGLE_CLIENT_SECRET ||
        isWeakOrPlaceholderSecret(validatedConfig.GOOGLE_CLIENT_SECRET)
      ) {
        securityViolations.push(
          'GOOGLE_CLIENT_SECRET is missing or contains placeholder values while Google OAuth is enabled.',
        );
      }
      if (
        validatedConfig.GOOGLE_CALLBACK_URL &&
        containsLocalhost(validatedConfig.GOOGLE_CALLBACK_URL)
      ) {
        securityViolations.push(
          'GOOGLE_CALLBACK_URL in production must not point to localhost.',
        );
      }
    }

    const isGithubOAuthEnabled =
      validatedConfig.GITHUB_OAUTH_ENABLED === 'true' ||
      Boolean(
        validatedConfig.GITHUB_CLIENT_ID &&
        !validatedConfig.GITHUB_CLIENT_ID.includes('placeholder'),
      );

    if (isGithubOAuthEnabled) {
      if (
        !validatedConfig.GITHUB_CLIENT_ID ||
        isWeakOrPlaceholderSecret(validatedConfig.GITHUB_CLIENT_ID)
      ) {
        securityViolations.push(
          'GITHUB_CLIENT_ID is missing or contains placeholder values while GitHub OAuth is enabled.',
        );
      }
      if (
        !validatedConfig.GITHUB_CLIENT_SECRET ||
        isWeakOrPlaceholderSecret(validatedConfig.GITHUB_CLIENT_SECRET)
      ) {
        securityViolations.push(
          'GITHUB_CLIENT_SECRET is missing or contains placeholder values while GitHub OAuth is enabled.',
        );
      }
      if (
        validatedConfig.GITHUB_CALLBACK_URL &&
        containsLocalhost(validatedConfig.GITHUB_CALLBACK_URL)
      ) {
        securityViolations.push(
          'GITHUB_CALLBACK_URL in production must not point to localhost.',
        );
      }
    }
  }

  if (securityViolations.length > 0) {
    const formattedViolations = securityViolations.join('; ');
    throw new Error(
      `[CONFIG_FATAL] Invalid environment variables: ${formattedViolations}`,
    );
  }

  return validatedConfig;
}
