export interface ApiClientConfig {
  baseUrl?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '';
  }

  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`);
    if (!res.ok) {
      throw new Error(`API Error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }
}

export const apiClient = new ApiClient();
