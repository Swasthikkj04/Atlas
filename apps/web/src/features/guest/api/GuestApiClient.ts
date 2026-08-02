import type {
  ExecutiveBriefData,
  Technology,
  Observation,
  TimelineEntry,
  EvidenceRow,
  AssessmentData,
} from "../types";

export interface GuestApiClient {
  understand(domain: string): Promise<{ jobId: string; sessionId: string; status: string }>;
  postGuestUnderstand(domain: string): Promise<{ jobId: string; sessionId: string; status: string }>;
  getGuestJob(jobId: string): Promise<{ stage: number; complete: boolean }>;
  getExecutiveBrief(domain: string): Promise<ExecutiveBriefData>;
  getTechnologies(): Promise<Technology[]>;
  getObservations(): Promise<Observation[]>;
  getTimeline(): Promise<TimelineEntry[]>;
  getEvidence(): Promise<EvidenceRow[]>;
  loadAssessmentData(domain: string): Promise<AssessmentData>;
}
