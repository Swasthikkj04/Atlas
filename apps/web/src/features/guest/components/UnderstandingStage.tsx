import { motion, AnimatePresence } from "motion/react";
import { SENTENCES, ease } from "../types";

interface UnderstandingStageProps {
  phase:       "VALIDATING" | "UNDERSTANDING" | "PAUSING";
  sentenceIdx: number;
  reduced:     boolean;
}

function ThinkingSequence({ phase, sentenceIdx, reduced }: UnderstandingStageProps) {
  const animationKey = phase === "PAUSING" ? "frozen" : sentenceIdx;
  const displayText = phase === "PAUSING"
    ? SENTENCES[sentenceIdx].replace(/…$/, ".")
    : SENTENCES[sentenceIdx];

  const motionTransition = {
    opacity: { duration: 0.22, ease },
    filter:  { duration: 0.18, ease },
    y:       { duration: 0.22, ease },
  };

  return (
    <>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {SENTENCES[sentenceIdx]}
      </p>

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

export default UnderstandingStage;
