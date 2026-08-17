// ─── State machine ────────────────────────────────────────────────────────────
// GX-003 defines six ordered phases.
// Every component reacts to the current phase.
// No component renders out of sequence.

export type GuestPhase =
  | "IDLE"          // Hero shown, domain input ready
  | "VALIDATING"    // API call in flight after submission (~300ms)
  | "UNDERSTANDING" // Thinking sequence running
  | "PAUSING"       // SX-002: The Nebula Pause (~520ms of stillness)
  | "UNDERSTOOD"    // Assessment data loaded, sections revealing progressively
  | "CONVERTED"     // User created a workspace
  | "ERROR";        // Understanding failed

// ─── Error codes ──────────────────────────────────────────────────────────────
// Typed error codes allow the error display to show appropriate copy.
//   NETWORK_FAILURE           — POST /guest/understand failed (connectivity / server error)
//   DOMAIN_INSUFFICIENT_SIGNAL — backend lacks enough public signal for this domain
//   DATA_LOAD_FAILED           — assessment data load failed after understanding began

export type GuestErrorCode =
  | "NETWORK_FAILURE"
  | "DOMAIN_INSUFFICIENT_SIGNAL"
  | "DATA_LOAD_FAILED"
  | null;

// ─── Assessment data ──────────────────────────────────────────────────────────

// GX-008: confidence is a semantic tier, not a number.
// version and evidenceCount are optional — omitted when not confidently detected.
export type TechConfidence = "high" | "medium" | "low";

export interface Technology {
  name:           string;
  role:           string;
  confidence:     TechConfidence;
  category?:      string;       // e.g. "CDN", "Database" — available for future filtering
  version?:       string;       // only present when confidently detected; never "Unknown"
  evidenceCount?: number;       // number of independent signals
}

// GX-009: severity maps to guidance language — never exposed as "Critical / High / Medium / Low"
export type ObservationSeverity   = "critical" | "high" | "medium" | "low" | "informational";
export type ObservationConfidence = "high" | "medium" | "low";

export interface Observation {
  label:          string;              // Title — engineering language, short
  body:           string;              // Narrative — what Nebula observed (prose)
  whyItMatters?:  string;              // Editorial annotation — why this deserves attention
  severity?:      ObservationSeverity; // Drives guidance label, never displayed raw
  confidence?:    ObservationConfidence;
  evidenceCount?: number;              // independent signals supporting this observation
  category?:      string;              // e.g. "HTTP Response Headers", "DNS", "TLS"
  firstObserved?: string;              // ISO date string
}

// GX-010: Each entry is an interpreted engineering observation, not a log record.
// date          — ISO-8601 date string used in <time datetime> for accessibility
// relativeTime  — human natural phrasing ("Today", "3 days ago", "Last week")
// headline      — short interpretive statement; no implementation jargon
// narrative     — 1–2 paragraphs explaining significance, not mere occurrence
// observationBasis — "Supported by DNS and HTTP observations" (optional)
// category      — infrastructure area ("Edge Delivery", "TLS", "Frontend")
export interface TimelineEntry {
  date:              string;   // ISO-8601 e.g. "2024-11-14"
  headline:          string;
  narrative:         string;
  observationBasis?: string;
  category?:         string;
}

// GX-011: Full evidence entry — the appendix of the infrastructure report.
// category groups entries for independent accordion collapse.
// payload is lazy — not rendered until the user reveals it.
// hash signals that cryptographic provenance is available without showing the value.
export interface EvidenceRow {
  id:                   string;
  category:             string;        // Groups entries: "HTTP Responses", "DNS", "TLS Certificates"…
  title:                string;
  summary:              string;        // 1–2 sentences explaining what was observed
  source?:              string;        // "HTTP response", "DNS lookup", "TLS handshake"
  collectedAt:          string;        // ISO-8601 date
  payload:              string;        // Raw evidence text — revealed on demand
  hash?:                string;        // SHA-256 fingerprint of payload
  collector?:           string;        // "Collector v1.2"
  relatedTechnologies?: string[];      // ["Cloudflare", "React"]
  relatedObservations?: string[];      // ["Email authentication policy allows soft-fail delivery"]
}

export interface ExecutiveBriefStats {
  techCount:        number;
  observationCount: number;
  evidenceCount:    number;   // GX-007: shown in Summary Metrics
  timelineCount:    number;   // GX-007: shown in Summary Metrics
  criticalCount:    number;
}

export interface ExecutiveBriefData {
  paragraphs: string[];       // 0 paragraphs → empty brief state
  stats:      ExecutiveBriefStats;
  briefError?: boolean;       // true → show error recovery copy instead of narrative
}

export interface AssessmentData {
  brief: ExecutiveBriefData;
  technologies: Technology[];
  observations: Observation[];
  timeline: TimelineEntry[];
  evidence: EvidenceRow[];
}

// ─── Machine interfaces ───────────────────────────────────────────────────────

export interface GuestState {
  phase:       GuestPhase;
  domain:      string;          // The submitted domain (displayDomain)
  sentenceIdx: number;          // 0–4, current thinking sentence
  sections:    number;          // 0–6, progressive reveal counter
  data:        AssessmentData | null;
  error:       GuestErrorCode;  // Typed error code — null when no error
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

// ─── SX-001: Understanding sentence sequence ──────────────────────────────────
// GX-006: Revised copy. Each statement communicates a reasoning step.
// Trailing "…" is intentional per the spec — do not add extra punctuation.
// During PAUSING, UnderstandingStage replaces "…" with "." to signal completion.

export const SENTENCES = [
  "Understanding public infrastructure…",
  "Resolving network relationships…",
  "Identifying deployed technologies…",
  "Connecting infrastructure observations…",
  "Preparing Executive Brief…",
] as const;

// GX-006: Timing within the 1.2–1.5 s range per sentence.
// Each sentence owns its duration — no artificial acceleration.
export const SENTENCE_DURATIONS: readonly number[] = [1450, 1300, 1400, 1250, 1350];

// ─── Validation & normalisation ───────────────────────────────────────────────

export const DOMAIN_RE =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

// isValidDomain — tests a pre-normalised domain string (no protocol, no path).
export const isValidDomain = (v: string): boolean => DOMAIN_RE.test(v.trim());

// normalizeDomain — strips protocol prefix, path, query, fragment, then lowercases.
// Called in HeroSection before validation and submission so the machine always
// receives a clean, lowercase domain name.
//
// Examples:
//   "https://Example.com/path?q=1" → "example.com"
//   "  GitHub.com  "               → "github.com"
//   "sub.example.co.uk"            → "sub.example.co.uk"

export function normalizeDomain(raw: string): string {
  let d = raw.trim().toLowerCase();

  // Strip protocol (http:// or https://)
  d = d.replace(/^https?:\/\//i, "");

  // Strip everything from the first path separator onward
  const slash = d.indexOf("/");
  if (slash !== -1) d = d.slice(0, slash);

  // Strip query string
  const q = d.indexOf("?");
  if (q !== -1) d = d.slice(0, q);

  // Strip fragment
  const hash = d.indexOf("#");
  if (hash !== -1) d = d.slice(0, hash);

  // Strip trailing dot
  return d.replace(/\.$/, "");
}
