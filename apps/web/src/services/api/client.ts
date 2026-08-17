export interface ApiClientConfig {
  baseUrl?: string;
}

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'NETWORK_FAILURE') {
    super(message, 0, 'NETWORK_FAILURE');
    this.name = 'NetworkError';
  }
}

export class InsufficientSignalError extends ApiError {
  constructor(message = 'DOMAIN_INSUFFICIENT_SIGNAL') {
    super(message, 422, 'DOMAIN_INSUFFICIENT_SIGNAL');
    this.name = 'InsufficientSignalError';
  }
}

function getCsrfCookieValue(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)(?:__Host-)?nebula_csrf_token=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  const fallback = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return fallback ? decodeURIComponent(fallback[1]) : null;
}

export class ApiClient {
  private baseUrl: string;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '';
  }

  async get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        signal,
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (endpoint.startsWith('/api/v1/guest') && (res.status === 404 || res.status === 422)) {
          throw new InsufficientSignalError();
        }
        throw new ApiError(
          errData?.message || `API Error ${res.status}: ${res.statusText}`,
          res.status,
          errData?.code
        );
      }
      return res.json() as Promise<T>;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new NetworkError();
    }
  }

  async post<T, B = unknown>(endpoint: string, body?: B, signal?: AbortSignal): Promise<T> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const csrfToken = getCsrfCookieValue();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (endpoint.startsWith('/api/v1/guest') && (res.status === 404 || res.status === 422)) {
          throw new InsufficientSignalError();
        }
        throw new ApiError(
          errData?.message || `API Error ${res.status}: ${res.statusText}`,
          res.status,
          errData?.code
        );
      }
      return res.json() as Promise<T>;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new NetworkError();
    }
  }

  async delete<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    try {
      const headers: Record<string, string> = {};
      const csrfToken = getCsrfCookieValue();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
        signal,
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new ApiError(
          errData?.message || `API Error ${res.status}: ${res.statusText}`,
          res.status,
          errData?.code
        );
      }
      return res.json() as Promise<T>;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new NetworkError();
    }
  }
}

export const apiClient = new ApiClient();
