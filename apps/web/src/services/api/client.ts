export interface ApiClientConfig {
  baseUrl?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '';
  }

  async get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      signal,
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`API Error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  async post<T, B = unknown>(endpoint: string, body: B, signal?: AbortSignal): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `API Error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  async delete<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      signal,
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `API Error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }
}

export const apiClient = new ApiClient();
