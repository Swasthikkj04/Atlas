// ─── Internal Analytics Event Bus ─────────────────────────────────────────────
//
// GX-005 requirement: emit four named events at key submission moments.
// No third-party analytics. Internal event bus only.
//
// Implementation: CustomEvent on window.
// Events are namespaced as "nebula:<EVENT_NAME>" to avoid collisions.
// Failures in emit are silently absorbed — analytics must never affect UX.
//
// Consumers (future telemetry pipeline, dev tooling, E2E test fixtures):
//   import { on } from "./analytics";
//   const off = on("DOMAIN_SUBMITTED", ({ domain }) => ...);
//   off(); // unsubscribe

export type AnalyticsEventName =
  | "DOMAIN_SUBMITTED"                 // User submitted a domain; validation passed
  | "UNDERSTANDING_STARTED"            // POST succeeded; UNDERSTANDING phase entered
  | "UNDERSTANDING_SEQUENCE_STARTED"   // GX-006: visual sentence sequence began
  | "UNDERSTANDING_SEQUENCE_COMPLETED" // GX-006: all sentences shown; entering PAUSING
  | "EXECUTIVE_BRIEF_REVEALED"         // GX-007: final paragraph became visible
  | "TECHNOLOGY_SUMMARY_REVEALED"      // GX-008: technology rows became visible
  | "OBSERVATIONS_REVEALED"            // GX-009: infrastructure observations became visible
  | "TIMELINE_REVEALED"               // GX-010: infrastructure timeline became visible
  | "EVIDENCE_EXPLORER_REVEALED"      // GX-011: evidence explorer section became visible
  | "EVIDENCE_EXPANDED"               // GX-011: user revealed a single evidence entry payload
  | "EVIDENCE_COPIED"                 // GX-011: user copied an evidence payload
  | "WORKSPACE_CONVERSION_REVEALED"   // GX-012: workspace conversion section became visible
  | "WORKSPACE_CONVERSION_STARTED"    // GX-012: user selected Create Workspace
  | "LOGIN_SELECTED"                  // GX-012: user selected Sign In
  | "VALIDATION_FAILED"                // Client-side validation rejected the input
  | "SUBMISSION_FAILED";               // POST /guest/understand returned an error

export interface AnalyticsPayload {
  domain?: string;
  reason?: string;
  [key: string]: unknown;
}

const NS = "nebula:";

// ── emit ───────────────────────────────────────────────────────────────────────

export function emit(name: AnalyticsEventName, payload?: AnalyticsPayload): void {
  try {
    window.dispatchEvent(
      new CustomEvent(`${NS}${name}`, { detail: payload ?? {}, bubbles: false })
    );
  } catch {
    // never throw — analytics is a side effect, not a requirement
  }

  // Surface to devtools in development
  if (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
    console.debug(`[Nebula Analytics] ${name}`, payload ?? "");
  }
}

// ── on ─────────────────────────────────────────────────────────────────────────
// Subscribe to an event. Returns an unsubscribe function.

export function on(
  name: AnalyticsEventName,
  handler: (payload: AnalyticsPayload) => void
): () => void {
  const key = `${NS}${name}`;
  const listener = (e: Event) =>
    handler((e as CustomEvent<AnalyticsPayload>).detail ?? {});
  window.addEventListener(key, listener);
  return () => window.removeEventListener(key, listener);
}
