/**
 * S-06 Scoped Secret Provider & Least Privilege Access
 *
 * Enforces component-scoped secret isolation so that unrelated application modules
 * cannot access cryptographic signing keys or admin secrets.
 */

export type ApplicationComponent =
  | 'AUTH_SERVICE'
  | 'ADMIN_AUTH_SERVICE'
  | 'DATA_ENCRYPTION_SERVICE'
  | 'AUDIT_SERVICE'
  | 'EMAIL_SERVICE'
  | 'OAUTH_SERVICE'
  | 'DATABASE_CLIENT'
  | 'PUBLIC_WORKSPACE';

export const COMPONENT_SECRET_PERMISSIONS: Record<
  ApplicationComponent,
  Set<string>
> = {
  AUTH_SERVICE: new Set(['JWT_SECRET', 'REFRESH_TOKEN_KEY', 'CSRF_SECRET']),
  ADMIN_AUTH_SERVICE: new Set([
    'ADMIN_JWT_SECRET',
    'ADMIN_SIGNING_SECRET',
    'ADMIN_KEYRING',
  ]),
  DATA_ENCRYPTION_SERVICE: new Set([
    'DATA_ENCRYPTION_KEY',
    'KEY_ENCRYPTION_KEY',
  ]),
  AUDIT_SERVICE: new Set(['AUDIT_HMAC_KEY']),
  EMAIL_SERVICE: new Set(['SMTP_PASSWORD', 'RESEND_API_KEY']),
  OAUTH_SERVICE: new Set(['GOOGLE_CLIENT_SECRET', 'GITHUB_CLIENT_SECRET']),
  DATABASE_CLIENT: new Set(['DATABASE_URL', 'DIRECT_URL']),
  PUBLIC_WORKSPACE: new Set([]), // No secret access permitted
};

export class ScopedSecretProvider {
  /**
   * Retrieves a secret on behalf of a specific component.
   * Fails closed if the requesting component does not have explicit entitlement.
   */
  static getSecret(
    component: ApplicationComponent,
    secretName: string,
  ): string {
    const allowedSecrets = COMPONENT_SECRET_PERMISSIONS[component];
    if (!allowedSecrets || !allowedSecrets.has(secretName)) {
      throw new Error(
        `[S06-I13] Unauthorized secret access: Component "${component}" is not permitted to access secret "${secretName}".`,
      );
    }

    const value = process.env[secretName];
    if (!value) {
      throw new Error(
        `[S06-I15] Required secret "${secretName}" is not configured in the environment.`,
      );
    }

    return value;
  }

  /**
   * Evaluates if an access request satisfies least-privilege scoping rules.
   */
  static evaluateSecretAccess(
    component: ApplicationComponent,
    secretName: string,
  ): { allowed: boolean; decision: string; reason?: string } {
    const allowedSecrets = COMPONENT_SECRET_PERMISSIONS[component];
    if (!allowedSecrets || !allowedSecrets.has(secretName)) {
      return {
        allowed: false,
        decision: 'LEAST_PRIVILEGE_ENFORCED',
        reason: `Component ${component} lacks access privilege for secret ${secretName}.`,
      };
    }

    return {
      allowed: true,
      decision: 'SECRET_ACCESS_GRANTED',
    };
  }

  /**
   * Scans a configuration object for accidental hardcoded secrets or production keys in .env.
   */
  static evaluateConfigurationPosture(config: Record<string, string>): {
    valid: boolean;
    decision: string;
    violations: string[];
  } {
    const violations: string[] = [];

    for (const [key, val] of Object.entries(config)) {
      if (!val) continue;

      // Check for production-like API keys in template files
      if (/^(sk_live|pk_live|ghp_|gho_|xoxb-|xoxp-)/.test(val)) {
        violations.push(
          `Live production secret detected in configuration key: ${key}`,
        );
      }

      // Check for committed private keys
      if (
        val.includes('-----BEGIN PRIVATE KEY-----') ||
        val.includes('-----BEGIN RSA PRIVATE KEY-----')
      ) {
        violations.push(
          `Unencrypted private key detected in configuration key: ${key}`,
        );
      }

      // Check for unredacted DB credentials
      if (
        /postgres:\/\/[a-zA-Z0-9]+:(?!password|postgres|mock|dummy|test)[a-zA-Z0-9!@#$%^&*]+@/.test(
          val,
        )
      ) {
        violations.push(
          `Potential production database credentials in key: ${key}`,
        );
      }
    }

    if (violations.length > 0) {
      return {
        valid: false,
        decision: 'ENV_FILE_SECRET_BLOCKED',
        violations,
      };
    }

    return {
      valid: true,
      decision: 'CONFIGURATION_SAFE',
      violations: [],
    };
  }
}
