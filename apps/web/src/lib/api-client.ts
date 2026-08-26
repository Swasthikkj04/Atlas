import { env } from '../config/env.config.ts';
import { isAuthEndpointExempt } from '../features/auth/contracts/session-renewal.contract.ts';

/**
 * Standardized API Error Hierarchy for Nebula.
 */
export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'NETWORK_FAILURE') {
    super(message, 0, 'NETWORK_FAILURE');
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required to access this resource') {
    super(message, 401, 'AUTH_REQUIRED');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'You do not have permission to access this resource') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'The requested resource was not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class InsufficientSignalError extends ApiError {
  constructor(message = 'DOMAIN_INSUFFICIENT_SIGNAL') {
    super(message, 422, 'DOMAIN_INSUFFICIENT_SIGNAL');
    this.name = 'InsufficientSignalError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * Helper to safely extract CSRF token from document cookie.
 * Supports standard and secure/host-prefixed cookie names.
 */
export function getCsrfCookieValue(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    /(?:^|;\s*)(?:__Secure-|__Host-)?nebula_csrf_token=([^;]+)/,
  );
  if (match) return decodeURIComponent(match[1]);
  const fallback = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return fallback ? decodeURIComponent(fallback[1]) : null;
}

export interface ApiClientConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  onSessionExpired?: () => void;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
}

export type RequestOptionsOrSignal = RequestOptions | AbortSignal;

function normalizeOptions(optionsOrSignal?: RequestOptionsOrSignal): RequestOptions {
  if (!optionsOrSignal) return {};
  if (
    optionsOrSignal instanceof AbortSignal ||
    ('aborted' in optionsOrSignal && typeof (optionsOrSignal as AbortSignal).addEventListener === 'function')
  ) {
    return { signal: optionsOrSignal as AbortSignal };
  }
  return optionsOrSignal as RequestOptions;
}

/**
 * Production-grade API Client for Nebula Frontend (WX-001 / WX-1013).
 *
 * Implements:
 * - Single-Flight Silent Session Renewal upon 401 response (WX-1013)
 * - Automatic Request Retry upon successful session rotation
 * - CSRF cookie injection on state-modifying requests
 * - Standardized API error hierarchy
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private refreshPromise: Promise<boolean> | null = null;
  private onSessionExpired?: () => void;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl !== undefined ? config.baseUrl : env.apiBaseUrl;
    this.defaultHeaders = config.defaultHeaders || {};
    this.onSessionExpired = config.onSessionExpired;
  }

  public setOnSessionExpired(callback?: () => void): void {
    this.onSessionExpired = callback;
  }

  resolveUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    const base = this.baseUrl ? this.baseUrl.replace(/\/+$/, '') : '';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    if (base.endsWith('/api/v1')) {
      const stripped = cleanEndpoint.replace(/^\/api\/v1(?:\/|$)/, '/');
      return `${base}${stripped.startsWith('/') ? stripped : `/${stripped}`}`;
    }

    if (cleanEndpoint.startsWith('/api/v1') || cleanEndpoint.startsWith('/api/')) {
      return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
    }

    return base ? `${base}/api/v1${cleanEndpoint}` : `/api/v1${cleanEndpoint}`;
  }

  /**
   * Single-Flight Silent Session Renewal (WX-1013).
   * Concurrent 401 responses await a single shared /auth/refresh execution.
   */
  async executeSilentRefresh(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshUrl = this.resolveUrl('/auth/refresh');
        const csrfToken = getCsrfCookieValue();
        const headers: Record<string, string> = {
          ...this.defaultHeaders,
          'Content-Type': 'application/json',
        };
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken;
        }

        const res = await fetch(refreshUrl, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({}),
        });

        return res.ok;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown,
    optionsOrSignal?: RequestOptionsOrSignal,
    isRetry = false
  ): Promise<T> {
    const options = normalizeOptions(optionsOrSignal);

    try {
      const headers: Record<string, string> = {
        ...this.defaultHeaders,
        ...options.headers,
      };

      if (body !== undefined && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      // Inject CSRF token for state-modifying requests
      if (method !== 'GET') {
        const csrfToken = getCsrfCookieValue();
        if (csrfToken && !headers['X-CSRF-Token']) {
          headers['X-CSRF-Token'] = csrfToken;
        }
      }

      const url = this.resolveUrl(endpoint);
      const res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: options.signal,
        credentials: options.credentials || 'include',
      });

      // WX-1013: 401 Interception & Single-Flight Silent Refresh
      if (res.status === 401 && !isRetry && !isAuthEndpointExempt(endpoint)) {
        const refreshed = await this.executeSilentRefresh();
        if (refreshed) {
          // Retry original request once with fresh credentials
          return this.request<T>(method, endpoint, body, optionsOrSignal, true);
        } else {
          this.onSessionExpired?.();
        }
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const message =
          errData?.message ||
          (Array.isArray(errData?.errors) ? errData.errors[0] : null) ||
          `API Error ${res.status}: ${res.statusText}`;
        const code = errData?.code;

        if (endpoint.startsWith('/api/v1/guest') && (res.status === 404 || res.status === 422)) {
          throw new InsufficientSignalError();
        }

        switch (res.status) {
          case 401:
            throw new AuthenticationError(message);
          case 403:
            throw new AuthorizationError(message);
          case 404:
            throw new NotFoundError(message);
          case 422:
            throw new InsufficientSignalError(message);
          case 429:
            throw new RateLimitError(message);
          default:
            throw new ApiError(message, res.status, code, errData);
        }
      }

      // Handle 204 No Content
      if (res.status === 204) {
        return undefined as unknown as T;
      }

      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
      throw new NetworkError();
    }
  }

  async get<T>(endpoint: string, options?: RequestOptionsOrSignal): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T, B = unknown>(endpoint: string, body?: B, options?: RequestOptionsOrSignal): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  async put<T, B = unknown>(endpoint: string, body?: B, options?: RequestOptionsOrSignal): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  async patch<T, B = unknown>(endpoint: string, body?: B, options?: RequestOptionsOrSignal): Promise<T> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  async delete<T, B = unknown>(
    endpoint: string,
    body?: B,
    options?: RequestOptionsOrSignal,
  ): Promise<T> {
    return this.request<T>('DELETE', endpoint, body, options);
  }
}

export const apiClient = new ApiClient();
