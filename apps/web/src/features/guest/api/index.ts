import type { GuestApiClient } from "./GuestApiClient";
import { MockGuestApiClient } from "./MockGuestApiClient";
import { HttpGuestApiClient } from "./HttpGuestApiClient";

// Active client implementation: defaults to HttpGuestApiClient in production/integration,
// fallback to MockGuestApiClient if VITE_USE_MOCK_API is explicitly set to "true".
const USE_MOCK = (import.meta as { env?: { VITE_USE_MOCK_API?: string } }).env?.VITE_USE_MOCK_API === "true";

export const guestApiClient: GuestApiClient = USE_MOCK
  ? new MockGuestApiClient()
  : new HttpGuestApiClient();

// Helper re-exports for convenience and direct functional access
export const postGuestUnderstand = (domain: string) => guestApiClient.postGuestUnderstand(domain);
export const understand = (domain: string) => guestApiClient.understand(domain);
export const getGuestJob = (jobId: string) => guestApiClient.getGuestJob(jobId);
export const getExecutiveBrief = (domain: string) => guestApiClient.getExecutiveBrief(domain);
export const getTechnologies = () => guestApiClient.getTechnologies();
export const getObservations = () => guestApiClient.getObservations();
export const getTimeline = () => guestApiClient.getTimeline();
export const getEvidence = () => guestApiClient.getEvidence();
export const loadAssessmentData = (domain: string) => guestApiClient.loadAssessmentData(domain);

export * from "./GuestApiClient";
export * from "./MockGuestApiClient";
export * from "./HttpGuestApiClient";
