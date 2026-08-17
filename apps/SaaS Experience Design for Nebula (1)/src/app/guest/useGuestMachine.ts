// ─── useGuestMachine ──────────────────────────────────────────────────────────
//
// Core state machine. Owns all phase transitions and side effects.
// Components receive state and actions as props — never mutate directly.
//
// Transition graph:
//   IDLE → VALIDATING → UNDERSTANDING → PAUSING → UNDERSTOOD → CONVERTED
//                     ↘                                       ↗
//                      ERROR ──────────────────────────────────
//
// VALIDATING: transient (~300ms) — POST fires, UI reflects submission received.
// PAUSING:    SX-002 — UI freezes for ~520ms while all assessment data loads.
//             The Brief only reveals after the pause completes.
//
// Analytics (GX-005): four named events emitted via the internal event bus.
//   DOMAIN_SUBMITTED      — on every valid submit call
//   UNDERSTANDING_STARTED — when UNDERSTANDING phase is entered
//   SUBMISSION_FAILED     — when POST fails (network or signal)
//   DATA_LOAD_FAILED      — when assessment load fails after UNDERSTANDING

import { useState, useRef, useCallback, useEffect } from "react";
import type { GuestState, GuestMachine, GuestErrorCode } from "./types";
import { SENTENCES, SENTENCE_DURATIONS } from "./types";
import { postGuestUnderstand, loadAssessmentData } from "./api";
import { emit } from "./analytics";

// ─── Initial state ─────────────────────────────────────────────────────────────

const INITIAL: GuestState = {
  phase:       "IDLE",
  domain:      "",
  sentenceIdx: 0,
  sections:    0,
  data:        null,
  error:       null,
};

// ─── Machine ──────────────────────────────────────────────────────────────────

export function useGuestMachine(): GuestMachine {
  const [state, setState] = useState<GuestState>(INITIAL);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Timer management ────────────────────────────────────────────────────────

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  // ── submit ──────────────────────────────────────────────────────────────────
  //
  // Receives a pre-normalised, pre-validated domain from HeroSection.
  // Responsible for the API call, error handling, and full UNDERSTANDING sequence.

  const submit = useCallback(
    async (domain: string) => {
      clearTimers();

      // Analytics: user submitted a valid domain
      emit("DOMAIN_SUBMITTED", { domain });

      // VALIDATING — brief window while POST fires
      setState({ ...INITIAL, phase: "VALIDATING", domain });

      // ── POST /guest/understand ─────────────────────────────────────────────

      let jobId: string;
      try {
        const result = await postGuestUnderstand(domain);
        jobId = result.jobId;
      } catch (err) {
        // Discriminate network failure from domain signal failure
        const errorCode: GuestErrorCode =
          err instanceof Error && err.message === "DOMAIN_INSUFFICIENT_SIGNAL"
            ? "DOMAIN_INSUFFICIENT_SIGNAL"
            : "NETWORK_FAILURE";

        emit("SUBMISSION_FAILED", { domain, reason: errorCode });
        setState({ ...INITIAL, phase: "ERROR", domain, error: errorCode });
        return;
      }

      // Analytics: understanding job created, thinking begins
      emit("UNDERSTANDING_STARTED", { domain, jobId });

      // UNDERSTANDING — thinking sentence sequence begins
      emit("UNDERSTANDING_SEQUENCE_STARTED", { domain });
      setState((prev) => ({ ...prev, phase: "UNDERSTANDING", sentenceIdx: 0 }));

      let idx = 0;

      const advance = () => {
        if (idx < SENTENCES.length - 1) {
          idx++;
          setState((prev) => ({ ...prev, sentenceIdx: idx }));
          schedule(advance, SENTENCE_DURATIONS[idx] ?? 1350);
        } else {
          // GX-006: sequence complete — all sentences shown
          emit("UNDERSTANDING_SEQUENCE_COMPLETED", { domain });

          // Enter SX-002 Nebula Pause
          schedule(() => {
            setState((prev) => ({ ...prev, phase: "PAUSING" }));

            // Load all data during the pause (transparent to user)
            loadAssessmentData(domain)
              .then((data) => {
                // UNDERSTOOD — data ready, begin progressive reveal after pause
                schedule(() => {
                  setState((prev) => ({
                    ...prev,
                    phase:    "UNDERSTOOD",
                    data,
                    sections: 0,
                  }));

                  // SX-004: Progressive Understanding — 6 sections, 530ms apart
                  [1, 2, 3, 4, 5, 6].forEach((n, i) => {
                    schedule(
                      () => setState((prev) => ({ ...prev, sections: n })),
                      i * 530 + 260
                    );
                  });
                }, 520); // SX-002 pause duration
              })
              .catch(() => {
                emit("SUBMISSION_FAILED", { domain, reason: "DATA_LOAD_FAILED" });
                setState({ ...INITIAL, phase: "ERROR", domain, error: "DATA_LOAD_FAILED" });
              });
          }, 1350);
        }
      };

      schedule(advance, SENTENCE_DURATIONS[0]);
    },
    [clearTimers, schedule]
  );

  // ── reset ───────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    clearTimers();
    setState(INITIAL);
  }, [clearTimers]);

  // ── convert ─────────────────────────────────────────────────────────────────

  const convert = useCallback(() => {
    setState((prev) => ({ ...prev, phase: "CONVERTED" }));
  }, []);

  // ── cleanup ─────────────────────────────────────────────────────────────────

  useEffect(() => () => clearTimers(), [clearTimers]);

  return { state, actions: { submit, reset, convert } };
}
