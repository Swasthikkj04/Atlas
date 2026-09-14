import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RotateCcw } from "lucide-react";

import { useTheme } from "../hooks/useTheme";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { ContentColumn } from "../components/ui";
import { GuestLayout } from "../components/GuestLayout";
import { GuestHeader } from "../components/GuestHeader";
import { GuestFooter } from "../components/GuestFooter";
import { HeroSection } from "../components/HeroSection";
import { UnderstandingStage } from "../components/UnderstandingStage";
import { GuestWorkspaceView } from "../components/workspace/GuestWorkspaceView";
import { ThemeToggle } from "../components/ThemeToggle";
import { CreateWorkspaceSurface } from "../../auth/components/CreateWorkspaceSurface";
import { telemetry } from "../../../services";
import {
  startGuestUnderstanding,
  getGuestUnderstandingJob,
  getGuestUnderstandingResult,
  subscribeToUnderstandingStream,
  InvalidDomainError,
  RateLimitError,
  PlatformError,
} from "../../../services/api";
import type {
  GuestPhase,
  GuestErrorCode,
  AssessmentData,
} from "../types";
import {
  SENTENCES,
  SENTENCE_DURATIONS,
  ease,
  normalizeDomain,
  isValidDomain,
} from "../types";

export default function GuestPage() {
  const [phase, setPhase] = useState<GuestPhase>("IDLE");
  const [domain, setDomain] = useState("");
  const [activeSession, setActiveSession] = useState<{ jobId: string; sessionId: string } | null>(null);
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [sections, setSections] = useState(0);
  const [data, setData] = useState<AssessmentData | null>(null);
  const [error, setError] = useState<GuestErrorCode>(null);

  const { mode, setMode } = useTheme();
  const reduced = useReducedMotion();

  const inputRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
  const resultsRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAbortControllerRef = useRef<AbortController | null>(null);
  const unsubscribeStreamRef = useRef<(() => void) | null>(null);
  const isPollingRef = useRef(false);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const stopStream = useCallback(() => {
    if (unsubscribeStreamRef.current) {
      unsubscribeStreamRef.current();
      unsubscribeStreamRef.current = null;
    }
  }, []);

  const stopPolling = useCallback(() => {
    stopStream();
    isPollingRef.current = false;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (pollAbortControllerRef.current) {
      pollAbortControllerRef.current.abort();
      pollAbortControllerRef.current = null;
    }
  }, [stopStream]);

  const hasAutoStartedRef = useRef(false);

  const handleReset = useCallback(() => {
    stopPolling();
    clearTimers();
    hasAutoStartedRef.current = false;
    setPhase("IDLE");
    setDomain("");
    setActiveSession(null);
    setSentenceIdx(0);
    setSections(0);
    setData(null);
    setError(null);
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => inputRef.current?.focus(), 420);
  }, [stopPolling]);

  const handleJobCompleted = useCallback(
    async (jobId: string) => {
      stopPolling();
      stopStream();
      try {
        const result = await getGuestUnderstandingResult(jobId);
        setData(result);
        setPhase("PAUSING");

        telemetry.track('SCAN_DOMAIN', {
          path: '/guest',
          surface: 'gx',
          submittedDomain: domain || result.domain,
          status: 'SUCCESS',
        });

        const tPause = setTimeout(() => {
          setPhase("UNDERSTOOD");
          setSections(1);
        }, 600);
        timers.current.push(tPause);
      } catch {
        clearTimers();
        setPhase("ERROR");
        setError("PLATFORM_FAILURE");
      }
    },
    [stopPolling, stopStream, domain],
  );

  const startPollingJob = useCallback((jobId: string) => {
    isPollingRef.current = true;

    const poll = async () => {
      if (!isPollingRef.current) return;

      const controller = new AbortController();
      pollAbortControllerRef.current = controller;

      try {
        const jobStatus = await getGuestUnderstandingJob(jobId, controller.signal);
        if (!isPollingRef.current) return;

        const status = jobStatus.status?.toUpperCase();

        if (status === "QUEUED" || status === "PENDING") {
          pollTimerRef.current = setTimeout(poll, 1000);
        } else if (status === "RUNNING") {
          setPhase("UNDERSTANDING");
          pollTimerRef.current = setTimeout(poll, 1000);
        } else if (status === "COMPLETED") {
          handleJobCompleted(jobId);
        } else if (status === "FAILED") {
          stopPolling();
          clearTimers();
          setPhase("ERROR");
          setError("PLATFORM_FAILURE");
        } else {
          stopPolling();
          clearTimers();
          setPhase("ERROR");
          setError("PLATFORM_FAILURE");
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        if (!isPollingRef.current) return;

        stopPolling();
        clearTimers();
        setPhase("ERROR");
        if (err instanceof RateLimitError) {
          setError("RATE_LIMIT_EXCEEDED");
        } else if (err instanceof InvalidDomainError) {
          setError("DOMAIN_INSUFFICIENT_SIGNAL");
        } else if (err instanceof PlatformError) {
          setError("PLATFORM_FAILURE");
        } else {
          setError("NETWORK_FAILURE");
        }
      }
    };

    poll();
  }, [stopPolling, handleJobCompleted]);

  const startStreamingOrPolling = useCallback(
    (jobId: string) => {
      stopStream();

      let isStreamActive = true;

      try {
        const unsubscribe = subscribeToUnderstandingStream(jobId, {
          onInit: (payload) => {
            if (!isStreamActive) return;
            if (payload.stage === "COMPLETED") {
              handleJobCompleted(jobId);
            } else if (payload.stage === "FAILED") {
              stopStream();
              clearTimers();
              setPhase("ERROR");
              setError("PLATFORM_FAILURE");
            }
          },
          onProgress: (payload) => {
            if (!isStreamActive) return;
            if (payload.stageIndex && payload.stageIndex > 1) {
              setSentenceIdx((prev) =>
                Math.min(
                  SENTENCES.length - 1,
                  Math.max(prev, payload.stageIndex! - 1),
                ),
              );
            }
          },
          onComplete: () => {
            if (!isStreamActive) return;
            handleJobCompleted(jobId);
          },
          onError: () => {
            if (!isStreamActive) return;
            // Fallback to polling seamlessly if SSE fails
            startPollingJob(jobId);
          },
        });

        unsubscribeStreamRef.current = () => {
          isStreamActive = false;
          unsubscribe();
        };
      } catch {
        startPollingJob(jobId);
      }
    },
    [stopStream, handleJobCompleted, startPollingJob],
  );

  const handleSubmit = useCallback(
    async (submittedDomain: string) => {
      const normalized = normalizeDomain(submittedDomain);
      if (!normalized || !isValidDomain(normalized)) {
        setError("DOMAIN_INSUFFICIENT_SIGNAL");
        setPhase("ERROR");
        return;
      }

      stopPolling();
      clearTimers();
      setDomain(normalized);
      setError(null);
      setPhase("VALIDATING");

      telemetry.track('SCAN_DOMAIN', {
        path: '/guest',
        surface: 'gx',
        submittedDomain: normalized,
      });

      try {
        const response = await startGuestUnderstanding(normalized);
        setActiveSession({ jobId: response.jobId, sessionId: response.sessionId });

        setPhase("UNDERSTANDING");
        setSentenceIdx(0);

        let idx = 0;
        const advance = () => {
          if (idx < SENTENCES.length - 1) {
            idx++;
            setSentenceIdx(idx);
            const tAdv = setTimeout(advance, SENTENCE_DURATIONS[idx] ?? 1350);
            timers.current.push(tAdv);
          }
        };

        const tFirst = setTimeout(advance, SENTENCE_DURATIONS[0]);
        timers.current.push(tFirst);

        startStreamingOrPolling(response.jobId);
      } catch (err) {
        setPhase("ERROR");
        if (err instanceof InvalidDomainError) {
          setError("DOMAIN_INSUFFICIENT_SIGNAL");
        } else if (err instanceof RateLimitError) {
          setError("RATE_LIMIT_EXCEEDED");
        } else if (err instanceof PlatformError) {
          setError("PLATFORM_FAILURE");
        } else {
          setError("NETWORK_FAILURE");
        }
      }
    },
    [stopPolling, startStreamingOrPolling],
  );

  // Auto-initiate domain understanding if URL contains ?domain=... or ?d=...
  useEffect(() => {
    if (typeof window === "undefined" || hasAutoStartedRef.current) return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryDomain = searchParams.get("domain") || searchParams.get("d");
      if (queryDomain) {
        const normalized = normalizeDomain(queryDomain);
        if (normalized && isValidDomain(normalized)) {
          hasAutoStartedRef.current = true;
          setDomain(normalized);
          handleSubmit(normalized);
        }
      }
    } catch {
      // Gracefully ignore URL parsing error
    }
  }, [handleSubmit]);

  const handleConvert = () => {
    telemetry.track('CLAIM_SESSION', {
      path: '/guest',
      surface: 'gx',
      submittedDomain: domain,
    });
    setPhase("CONVERTED");
  };

  useEffect(() => {
    if (phase !== "UNDERSTOOD") return;
    const id = setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 360);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    return () => {
      stopPolling();
      clearTimers();
    };
  }, [stopPolling]);

  const isUnderstanding = phase === "VALIDATING" || phase === "UNDERSTANDING" || phase === "PAUSING";
  const isUnderstood = phase === "UNDERSTOOD" || phase === "CONVERTED";

  // When understood, render the Obsidian Guest Workspace Shell
  if (isUnderstood && data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col relative">
        <a
          href="#guest-main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-card focus:px-4 focus:py-2 focus:text-[12.5px] focus:font-medium focus:rounded-lg focus:shadow-md focus:border focus:border-border"
        >
          Skip to main content
        </a>

        <div
          ref={resultsRef}
          className={`transition-all duration-300 ${
            phase === "CONVERTED"
              ? "opacity-30 dark:opacity-25 pointer-events-none select-none"
              : "opacity-100"
          }`}
        >
          <GuestWorkspaceView
            domain={domain}
            assessmentData={data}
            sessionId={data?.sessionId || activeSession?.sessionId}
            jobId={data?.jobId || activeSession?.jobId}
            onReset={handleReset}
            onClaim={handleConvert}
            mode={mode}
            setMode={setMode}
          />
        </div>

        {/* Claim Workspace Dialog Overlay */}
        <AnimatePresence>
          {phase === "CONVERTED" && (
            <motion.div
              key="create-workspace-modal-overlay"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-background/60 backdrop-blur-xs pt-16 pb-12"
            >
              <CreateWorkspaceSurface
                domain={domain}
                sessionId={data?.sessionId || activeSession?.sessionId}
                jobId={data?.jobId || activeSession?.jobId}
                expiresAt={null}
                onClose={() => setPhase("UNDERSTOOD")}
                reduced={reduced}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <GuestLayout>
      <a
        href="#guest-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-card focus:px-4 focus:py-2 focus:text-[12.5px] focus:font-medium focus:rounded-lg focus:shadow-md focus:border focus:border-border"
      >
        Skip to main content
      </a>

      <GuestHeader
        phase={phase}
        displayDomain={domain}
        onReset={handleReset}
      />

      <main id="guest-main" role="main">
        <AnimatePresence mode="wait">
          {!isUnderstood && (
            <HeroSection
              key="hero"
              phase={phase}
              displayDomain={domain}
              sections={sections}
              onSubmit={handleSubmit}
              onReset={handleReset}
              reduced={reduced}
              inputRef={inputRef}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isUnderstanding && (
            <motion.div
              key="understanding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.32 } }}
              transition={{ duration: 0.35 }}
            >
              <UnderstandingStage
                phase={
                  phase === "PAUSING" ? "PAUSING" :
                  phase === "VALIDATING" ? "VALIDATING" :
                  "UNDERSTANDING"
                }
                sentenceIdx={sentenceIdx}
                domain={domain}
                reduced={reduced}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "ERROR" && (
            <motion.section
              key="error"
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease }}
              role="alert"
              aria-label="Understanding unavailable"
            >
              <ContentColumn className="pb-32 text-center">
                {error === "NETWORK_FAILURE" ? (
                  <>
                    <p className="font-display italic text-[1.125rem] text-muted-foreground mb-5">
                      Nebula couldn{"'"}t begin understanding.
                    </p>
                    <p className="text-[13.5px] text-muted-foreground/60 leading-[1.8] mb-9 max-w-[380px] mx-auto">
                      A network issue prevented the request from reaching Nebula.
                      Check your connection and try again.
                    </p>
                    <button
                      onClick={handleReset}
                      className="text-[13px] font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:opacity-90 active:opacity-70 transition-opacity shadow-[0_1px_3px_rgba(26,86,219,0.2)] focus-ring flex items-center gap-2 mx-auto"
                    >
                      <RotateCcw className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      Try again
                    </button>
                  </>
                ) : error === "RATE_LIMIT_EXCEEDED" ? (
                  <>
                    <p className="font-display italic text-[1.125rem] text-muted-foreground mb-5">
                      Guest rate limit reached.
                    </p>
                    <p className="text-[13.5px] text-muted-foreground/60 leading-[1.8] mb-9 max-w-[380px] mx-auto">
                      You have reached the maximum number of guest understanding requests. Please wait a few minutes before trying again.
                    </p>
                    <button
                      onClick={handleReset}
                      className="text-[13px] font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:opacity-90 active:opacity-70 transition-opacity shadow-[0_1px_3px_rgba(26,86,219,0.2)] focus-ring flex items-center gap-2 mx-auto"
                    >
                      <RotateCcw className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      Try again
                    </button>
                  </>
                ) : error === "PLATFORM_FAILURE" ? (
                  <>
                    <p className="font-display italic text-[1.125rem] text-muted-foreground mb-5">
                      Platform service unavailable.
                    </p>
                    <p className="text-[13.5px] text-muted-foreground/60 leading-[1.8] mb-9 max-w-[380px] mx-auto">
                      Nebula encountered a temporary platform error while processing your request. Please try again shortly.
                    </p>
                    <button
                      onClick={handleReset}
                      className="text-[13px] font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:opacity-90 active:opacity-70 transition-opacity shadow-[0_1px_3px_rgba(26,86,219,0.2)] focus-ring flex items-center gap-2 mx-auto"
                    >
                      <RotateCcw className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      Try again
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-display italic text-[1.125rem] text-muted-foreground mb-5">
                      Nebula couldn{"'"}t gather enough public signal for this domain.
                    </p>
                    <p className="text-[13.5px] text-muted-foreground/60 leading-[1.8] mb-9 max-w-[380px] mx-auto">
                      Some infrastructure is intentionally quiet. Private endpoints,
                      internal services, and very new domains often leave too little
                      public trace for a meaningful understanding. Try an established
                      public domain — like stripe.com — to see the full experience.
                    </p>
                    <button
                      onClick={handleReset}
                      className="text-[13px] font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:opacity-90 active:opacity-70 transition-opacity shadow-[0_1px_3px_rgba(26,86,219,0.2)] focus-ring flex items-center gap-2 mx-auto"
                    >
                      <RotateCcw className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      Understand a different domain
                    </button>
                  </>
                )}
              </ContentColumn>
            </motion.section>
          )}
        </AnimatePresence>

        <div className={phase === "CONVERTED" ? "opacity-30 pointer-events-none" : ""}>
          <GuestFooter phase={phase} />
        </div>
      </main>

      <ThemeToggle mode={mode} setMode={setMode} />
    </GuestLayout>
  );
}
