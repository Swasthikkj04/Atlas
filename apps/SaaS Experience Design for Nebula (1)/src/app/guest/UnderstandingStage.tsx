// ─── UnderstandingStage ───────────────────────────────────────────────────────
//
// GX-006: Nebula's signature understanding experience.
// Communicates thoughtful reasoning — not background processing.
//
// Contains:
//   ThinkingSequence — sentence crossfade with blur-to-focus materialisation
//   ProgressTrack    — thin editorial progress line, no labels
//   NebulaPause      — visual stillness implemented as frozen sentence key
//
// Motion ownership (GX-006):
//   ThinkingSequence owns: sentence transitions, progress track, aria-live
//   LivingLogo owns:       constellation animation (handled in LivingLogo.tsx)
//   BackgroundConstellation owns: background drift (handled there)
//
// Motion spec (GX-006):
//   Blur transition:  ~180 ms  (filter property)
//   Crossfade:        ~220 ms  (opacity property)
//   Per-property timing — filter completes 40ms before opacity so the sentence
//   becomes legible (sharp) just before it is fully opaque.
//
// Reduced motion: no blur, no crossfade animation, no progress animation.
//   Sentences still advance. Nebula Pause still occurs.
//
// Accessibility:
//   role="status" + aria-live="polite" on the live region.
//   Visual sentence is aria-hidden — screen reader reads the live region only.

import { motion, AnimatePresence } from "motion/react";
import { SENTENCES } from "./types";
import { ease } from "./ui";

interface UnderstandingStageProps {
  phase:       "VALIDATING" | "UNDERSTANDING" | "PAUSING";
  sentenceIdx: number;
  reduced:     boolean;
}

// ── ThinkingSequence ──────────────────────────────────────────────────────────

function ThinkingSequence({ phase, sentenceIdx, reduced }: UnderstandingStageProps) {
  // SX-002: During PAUSING, freeze the key so no new transition fires.
  const animationKey = phase === "PAUSING" ? "frozen" : sentenceIdx;

  // GX-006: Sentences carry intentional trailing "…".
  // During PAUSING, settle it to "." — the thought is complete.
  const displayText = phase === "PAUSING"
    ? SENTENCES[sentenceIdx].replace(/…$/, ".")
    : SENTENCES[sentenceIdx];

  // Per-property motion timing (GX-006):
  //   filter  (blur)   → 180 ms — legibility arrives first
  //   opacity (crossfade) → 220 ms — full presence arrives after
  const motionTransition = {
    opacity: { duration: 0.22, ease },
    filter:  { duration: 0.18, ease },
    y:       { duration: 0.22, ease },
  };

  return (
    <>
      {/* Screen reader live region */}
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {SENTENCES[sentenceIdx]}
      </p>

      {/* Visual sentence — aria-hidden; SR reads the live region */}
      <AnimatePresence mode="wait">
        <motion.p
          key={animationKey}
          aria-hidden="true"
          initial={
            reduced
              ? false
              : { opacity: 0, y: 8, filter: "blur(5px)" }
          }
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={
            reduced
              ? { opacity: 0 }
              : { opacity: 0, y: -6, filter: "blur(4px)" }
          }
          transition={reduced ? { duration: 0 } : motionTransition}
          className="font-display italic text-[1.125rem] sm:text-[1.1875rem] leading-relaxed text-muted-foreground select-none"
        >
          {displayText}
        </motion.p>
      </AnimatePresence>
    </>
  );
}

// ── ProgressTrack ─────────────────────────────────────────────────────────────
// Thin editorial line — communicates progression without implying completion.
// No percentage, no labels, no numeric indicators.

function ProgressTrack({ phase, sentenceIdx, reduced }: UnderstandingStageProps) {
  const fillPct = phase === "PAUSING"
    ? 100
    : Math.round(((sentenceIdx + 1) / SENTENCES.length) * 100);

  return (
    <div
      className="mt-8 max-w-[120px] mx-auto h-px bg-border rounded-full overflow-hidden"
      aria-hidden="true"
      role="presentation"
    >
      <motion.div
        className="h-full bg-foreground/20 rounded-full origin-left"
        initial={{ width: "0%" }}
        animate={{ width: `${fillPct}%` }}
        transition={{
          duration: reduced ? 0 : phase === "PAUSING" ? 0.35 : 0.55,
          ease,
        }}
      />
    </div>
  );
}

// ── UnderstandingStage (composed) ─────────────────────────────────────────────
//
// NebulaPause (SX-002) has no visual component of its own — the pause IS
// the frozen sentence key and the filled progress track in complete stillness.

export function UnderstandingStage(props: UnderstandingStageProps) {
  return (
    <section
      aria-label="Understanding in progress"
      className="max-w-[480px] mx-auto px-5 sm:px-8 pb-24 sm:pb-28 text-center"
    >
      <ThinkingSequence {...props} />
      <ProgressTrack {...props} />
    </section>
  );
}
