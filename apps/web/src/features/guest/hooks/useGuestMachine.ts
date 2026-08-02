// Core state machine hook for Guest Feature
import { useState, useRef, useCallback, useEffect } from "react";
import type { GuestState, GuestMachine, GuestErrorCode } from "../types";
import { SENTENCES } from "../constants/sentences";
import {
  SENTENCE_DURATIONS,
  PAUSE_DURATION,
  SECTION_REVEAL_INTERVAL,
  SECTION_REVEAL_INITIAL_DELAY,
} from "../constants/timings";
import { guestApiClient } from "../api";
import { emit } from "../analytics";

const INITIAL: GuestState = {
  phase:       "IDLE",
  domain:      "",
  sentenceIdx: 0,
  sections:    0,
  data:        null,
  error:       null,
};

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
        const result = await guestApiClient.postGuestUnderstand(domain);
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
            guestApiClient.loadAssessmentData(domain)
              .then((data) => {
                // UNDERSTOOD — data ready, begin progressive reveal after pause
                schedule(() => {
                  setState((prev) => ({
                    ...prev,
                    phase:    "UNDERSTOOD",
                    data,
                    sections: 0,
                  }));

                  // SX-004: Progressive Understanding — 6 sections
                  [1, 2, 3, 4, 5, 6].forEach((n, i) => {
                    schedule(
                      () => setState((prev) => ({ ...prev, sections: n })),
                      i * SECTION_REVEAL_INTERVAL + SECTION_REVEAL_INITIAL_DELAY
                    );
                  });
                }, PAUSE_DURATION); // SX-002 pause duration
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
