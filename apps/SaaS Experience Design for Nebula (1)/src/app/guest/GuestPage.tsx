// ─── GuestPage ────────────────────────────────────────────────────────────────
//
// Route: /guest
// Single evolving page. No route transitions. No reloads.
//
// Responsibilities:
//   - Composes GuestLayout with all guest sections
//   - Owns the guest state machine (useGuestMachine)
//   - Owns the theme (useTheme) — applies resolved .dark class via the hook
//   - Manages cross-component concerns: scroll, evidence accordion, focus
//   - Renders sections in the correct sequence per GX-003 rendering order
//
// Rendering order (GX-003):
//   GuestHeader → HeroSection → UnderstandingStage → [ErrorSection] →
//   ExecutiveBrief → TechnologySummary → ObservationsSection →
//   TimelineSection → EvidenceSection → WorkspaceConversion → GuestFooter
//   ThemeToggle (fixed, bottom-right)

import { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RotateCcw } from "lucide-react";

import { useGuestMachine }     from "./useGuestMachine";
import { useTheme }            from "./useTheme";
import { useReducedMotion }    from "./ui";
import { GuestLayout }         from "./GuestLayout";
import { GuestHeader }         from "./GuestHeader";
import { GuestFooter }         from "./GuestFooter";
import { HeroSection }         from "./HeroSection";
import { UnderstandingStage }  from "./UnderstandingStage";
import { ExecutiveBrief }      from "./ExecutiveBrief";
import { TechnologySummary }   from "./TechnologySummary";
import { ObservationsSection } from "./ObservationsSection";
import { TimelineSection }     from "./TimelineSection";
import { EvidenceSection }     from "./EvidenceSection";
import { WorkspaceConversion } from "./WorkspaceConversion";
import { ThemeToggle }         from "./ThemeToggle";
import { ease, ContentColumn } from "./ui";

export default function GuestPage() {
  const { state, actions } = useGuestMachine();
  const { mode, setMode }  = useTheme();
  const reduced            = useReducedMotion();

  const { phase, domain, sentenceIdx, sections, data } = state;

  // ── Cross-component refs ────────────────────────────────────────────────────

  const inputRef   = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
  const resultsRef = useRef<HTMLDivElement>(null);

  // (evidence accordion state is now owned internally by EvidenceSection)

  // ── Scroll to results when understanding completes ─────────────────────────

  useEffect(() => {
    if (phase !== "UNDERSTOOD") return;
    const id = setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 360);
    return () => clearTimeout(id);
  }, [phase]);

  // ── Focus management ───────────────────────────────────────────────────────

  const handleReset = () => {
    actions.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => inputRef.current?.focus(), 420);
  };

  const handleSubmit = (d: string) => {
    actions.submit(d);
  };

  // ── Derived flags ──────────────────────────────────────────────────────────

  const isUnderstanding = phase === "VALIDATING" || phase === "UNDERSTANDING" || phase === "PAUSING";
  const isUnderstood    = phase === "UNDERSTOOD"  || phase === "CONVERTED";

  return (
    <GuestLayout>

      {/* ── Skip link ─────────────────────────────────────────────────── */}
      <a
        href="#guest-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-card focus:px-4 focus:py-2 focus:text-[12.5px] focus:font-medium focus:rounded-lg focus:shadow-md focus:border focus:border-border"
      >
        Skip to main content
      </a>

      {/* ── GuestHeader ───────────────────────────────────────────────── */}
      <GuestHeader
        phase={phase}
        displayDomain={domain}
        onReset={handleReset}
      />

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main id="guest-main" role="main">

        {/* ── HeroSection ─────────────────────────────────────────────── */}
        <HeroSection
          phase={phase}
          displayDomain={domain}
          sections={sections}
          onSubmit={handleSubmit}
          onReset={handleReset}
          reduced={reduced}
          inputRef={inputRef}
        />

        {/* ── UnderstandingStage ──────────────────────────────────────── */}
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
                  phase === "PAUSING"    ? "PAUSING" :
                  phase === "VALIDATING" ? "VALIDATING" :
                  "UNDERSTANDING"
                }
                sentenceIdx={sentenceIdx}
                reduced={reduced}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error state (SX-011) ────────────────────────────────────── */}
        {/*
          GX-005: typed error codes drive copy selection.
          NETWORK_FAILURE      → transient; offer "Try again"
          DOMAIN_INSUFFICIENT_SIGNAL / DATA_LOAD_FAILED → offer "Try a different domain"
        */}
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
                {state.error === "NETWORK_FAILURE" ? (
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

        {/* ── Progressive results (SX-004) ────────────────────────────── */}
        <AnimatePresence>
          {isUnderstood && data && (
            <div
              ref={resultsRef}
              key="results"
              role="region"
              aria-label={`Infrastructure understanding for ${domain}`}
            >
              {sections >= 1 && (
                <ExecutiveBrief domain={domain} data={data.brief} reduced={reduced} />
              )}
              {sections >= 2 && (
                <TechnologySummary technologies={data.technologies} reduced={reduced} />
              )}
              {sections >= 3 && (
                <ObservationsSection observations={data.observations} reduced={reduced} />
              )}
              {sections >= 4 && (
                <TimelineSection timeline={data.timeline} reduced={reduced} />
              )}
              {sections >= 5 && (
                <EvidenceSection
                  evidence={data.evidence}
                  reduced={reduced}
                />
              )}
              {sections >= 6 && (
                <WorkspaceConversion
                  phase={phase}
                  onConvert={actions.convert}
                  onContinue={handleReset}
                  reduced={reduced}
                />
              )}
            </div>
          )}
        </AnimatePresence>

        {/* ── GuestFooter ─────────────────────────────────────────────── */}
        <GuestFooter phase={phase} />

      </main>

      {/* ── BX-004 Theme Toggle — fixed bottom-right ─────────────────── */}
      <ThemeToggle mode={mode} setMode={setMode} />

    </GuestLayout>
  );
}
