/**
 * Canonical Environment Configuration for Nebula Frontend.
 *
 * Provides typed, validated access to frontend environment variables.
 * Secrets must NEVER be embedded or referenced in client-side code.
 */

export interface EnvConfig {
  /** API Base URL (empty string for relative / same-origin in development proxy / production) */
  apiBaseUrl: string;
  /** Execution mode ('development' | 'production' | 'test') */
  mode: string;
  /** True if running in development mode */
  isDev: boolean;
  /** True if running in production mode */
  isProd: boolean;
  /** True if running in test environment */
  isTest: boolean;
}

/**
 * Resolves the active environment configuration safely.
 */
export function getEnvConfig(): EnvConfig {
  const isNodeTest =
    typeof process !== 'undefined' &&
    (process.env?.NODE_ENV === 'test' ||
      Boolean(process.env?.VITEST) ||
      typeof window === 'undefined');

  if (isNodeTest) {
    return {
      apiBaseUrl: (typeof process !== 'undefined' && process.env?.VITE_API_URL) || '',
      mode: process.env?.NODE_ENV || 'test',
      isDev: false,
      isProd: false,
      isTest: true,
    };
  }

  const mode = import.meta.env?.MODE || 'development';
  const apiBaseUrl = (import.meta.env?.VITE_API_URL as string) || '';

  return {
    apiBaseUrl,
    mode,
    isDev: import.meta.env?.DEV ?? mode === 'development',
    isProd: import.meta.env?.PROD ?? mode === 'production',
    isTest: false,
  };
}

export const env = getEnvConfig();
