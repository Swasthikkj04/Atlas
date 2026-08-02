import type {
  ExecutiveBriefData,
  Technology,
  Observation,
  TimelineEntry,
  EvidenceRow,
  AssessmentData,
} from "../types";
import type { GuestApiClient } from "./GuestApiClient";
import { apiClient, InsufficientSignalError, NetworkError } from "../../../services/api/client";

export class HttpGuestApiClient implements GuestApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL || "") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      if (options?.method === "POST") {
        const body = options.body ? JSON.parse(options.body as string) : {};
        return await apiClient.post<T>(url, body);
      }
      return await apiClient.get<T>(url);
    } catch (err) {
      if (err instanceof InsufficientSignalError || (err instanceof Error && err.message === "DOMAIN_INSUFFICIENT_SIGNAL")) {
        throw new Error("DOMAIN_INSUFFICIENT_SIGNAL", { cause: err });
      }
      if (err instanceof NetworkError || (err instanceof Error && err.message === "NETWORK_FAILURE")) {
        throw new Error("NETWORK_FAILURE", { cause: err });
      }
      throw new Error("NETWORK_FAILURE", { cause: err });
    }
  }

  async understand(domain: string): Promise<{ jobId: string; sessionId: string; status: string }> {
    return this.request<{ jobId: string; sessionId: string; status: string }>("/guest/understand", {
      method: "POST",
      body: JSON.stringify({ domain }),
    });
  }

  async postGuestUnderstand(domain: string): Promise<{ jobId: string; sessionId: string; status: string }> {
    return this.understand(domain);
  }

  async getGuestJob(jobId: string): Promise<{ stage: number; complete: boolean }> {
    return this.request<{ stage: number; complete: boolean }>(`/guest/jobs/${encodeURIComponent(jobId)}`, {
      method: "GET",
    });
  }

  async getExecutiveBrief(domain: string): Promise<ExecutiveBriefData> {
    const data = await this.request<ExecutiveBriefData>(`/guest/brief?domain=${encodeURIComponent(domain)}`, {
      method: "GET",
    });
    return this.mapExecutiveBrief(data);
  }

  async getTechnologies(): Promise<Technology[]> {
    const data = await this.request<Technology[]>("/guest/technologies", {
      method: "GET",
    });
    return this.mapTechnologies(data);
  }

  async getObservations(): Promise<Observation[]> {
    const data = await this.request<Observation[]>("/guest/findings", {
      method: "GET",
    });
    return this.mapObservations(data);
  }

  async getTimeline(): Promise<TimelineEntry[]> {
    const data = await this.request<TimelineEntry[]>("/guest/timeline", {
      method: "GET",
    });
    return this.mapTimeline(data);
  }

  async getEvidence(): Promise<EvidenceRow[]> {
    const data = await this.request<EvidenceRow[]>("/guest/evidence", {
      method: "GET",
    });
    return this.mapEvidence(data);
  }

  async loadAssessmentData(domain: string): Promise<AssessmentData> {
    try {
      const [brief, technologies, observations, timeline, evidence] = await Promise.all([
        this.getExecutiveBrief(domain),
        this.getTechnologies(),
        this.getObservations(),
        this.getTimeline(),
        this.getEvidence(),
      ]);
      return { brief, technologies, observations, timeline, evidence };
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message === "NETWORK_FAILURE" || err.message === "DOMAIN_INSUFFICIENT_SIGNAL")
      ) {
        throw err;
      }
      throw new Error("DATA_LOAD_FAILED", { cause: err });
    }
  }

  // ── DTO Mappers (Pass-throughs for contract flexibility) ────────────────────
  private mapExecutiveBrief(data: ExecutiveBriefData): ExecutiveBriefData {
    return data;
  }

  private mapTechnologies(data: Technology[]): Technology[] {
    return data;
  }

  private mapObservations(data: Observation[]): Observation[] {
    return data;
  }

  private mapTimeline(data: TimelineEntry[]): TimelineEntry[] {
    return data;
  }

  private mapEvidence(data: EvidenceRow[]): EvidenceRow[] {
    return data;
  }
}
