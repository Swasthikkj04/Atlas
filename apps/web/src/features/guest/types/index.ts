// Guest Experience Type Definitions

export type GuestPhase =
  | "IDLE"          // Hero shown, domain input ready
  | "VALIDATING"    // API call in flight after submission (~300ms)
  | "UNDERSTANDING" // Thinking sequence running
  | "PAUSING"       // SX-002: The Nebula Pause (~520ms of stillness)
  | "UNDERSTOOD"    // Assessment data loaded, sections revealing progressively
  | "CONVERTED"     // User created a workspace
  | "ERROR";        // Understanding failed

export type GuestErrorCode =
  | "NETWORK_FAILURE"
  | "DOMAIN_INSUFFICIENT_SIGNAL"
  | "DATA_LOAD_FAILED"
  | null;

export type TechConfidence = "high" | "medium" | "low";

export interface Technology {
  name:           string;
  role:           string;
  confidence:     TechConfidence;
  category?:      string;
  version?:       string;
  evidenceCount?: number;
}

export type ObservationSeverity   = "critical" | "high" | "medium" | "low" | "informational";
export type ObservationConfidence = "high" | "medium" | "low";

export interface Observation {
  label:          string;
  body:           string;
  whyItMatters?:  string;
  severity?:      ObservationSeverity;
  confidence?:    ObservationConfidence;
  evidenceCount?: number;
  category?:      string;
  firstObserved?: string;
}

export interface TimelineEntry {
  date:              string;
  headline:          string;
  narrative:         string;
  observationBasis?: string;
  category?:         string;
}

export interface EvidenceRow {
  id:                   string;
  category:             string;
  title:                string;
  summary:              string;
  source?:              string;
  collectedAt:          string;
  payload:              string;
  hash?:                string;
  collector?:           string;
  relatedTechnologies?: string[];
  relatedObservations?: string[];
}

export interface ExecutiveBriefStats {
  techCount:        number;
  observationCount: number;
  evidenceCount:    number;
  timelineCount:    number;
  criticalCount:    number;
}

export interface ExecutiveBriefData {
  paragraphs: string[];
  stats:      ExecutiveBriefStats;
  briefError?: boolean;
}

export interface AssessmentData {
  brief: ExecutiveBriefData;
  technologies: Technology[];
  observations: Observation[];
  timeline: TimelineEntry[];
  evidence: EvidenceRow[];
}

export interface GuestState {
  phase:       GuestPhase;
  domain:      string;
  sentenceIdx: number;
  sections:    number;
  data:        AssessmentData | null;
  error:       GuestErrorCode;
}

export interface GuestActions {
  submit:  (domain: string) => void;
  reset:   () => void;
  convert: () => void;
}

export interface GuestMachine {
  state:   GuestState;
  actions: GuestActions;
}
