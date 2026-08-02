import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { GuestPhase } from "../../types";
import { emit } from "../../analytics";
import { ease } from "../common";

const BENEFITS = [
  "Preserve infrastructure history",
  "Compare future changes",
  "Search across observations",
  "Build organisational knowledge",
] as const;

function ConvertedConfirmation({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="converted"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.42, ease }}
    >
      <p className="font-display text-[1.4375rem] sm:text-[1.6875rem] font-normal leading-[1.36] text-foreground mb-4 tracking-[-0.02em]">
        Workspace created.
      </p>
      <p className="text-[13px] sm:text-[13.5px] text-muted-foreground leading-[1.82] mb-8 max-w-[440px]">
        Nebula will continue watching this infrastructure and return with new
        observations, drift detection, and a growing picture of how it evolves.
      </p>
      <a
        href="/workspace"
        className="inline-flex items-center gap-2 text-[13px] font-medium bg-primary text-primary-foreground px-6 py-2.5 rounded-xl hover:opacity-90 active:opacity-70 transition-opacity shadow-[0_1px_3px_rgba(26,86,219,0.2)] focus-ring"
      >
        Open workspace
        <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
      </a>
    </motion.div>
  );
}

interface InvitationProps {
  onConvert: () => void;
  reduced:   boolean;
}

function InvitationSection({ onConvert, reduced }: InvitationProps) {
  const handleCreate = () => {
    emit("WORKSPACE_CONVERSION_STARTED");
    onConvert();
    try {
      window.location.href = "/auth/register";
    } catch {
      // navigation failure handled by browser fallback
    }
  };

  const handleLogin = () => {
    emit("LOGIN_SELECTED");
    try {
      window.location.href = "/auth/login";
    } catch {
      // navigation failure handled by browser fallback
    }
  };

  return (
    <motion.section
      key="invite"
      aria-label="Workspace conversion"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.42, ease }}
    >
      <h2 className="font-display text-[1.4375rem] sm:text-[1.6875rem] font-normal leading-[1.36] text-foreground mb-5 tracking-[-0.02em]">
        Continue Building Your Infrastructure History
      </h2>

      <p className="text-[13.5px] text-muted-foreground leading-[1.82] mb-7 max-w-[480px]">
        Guest understandings are temporary. Create a workspace to preserve your
        infrastructure history, compare future changes, and continue exploring
        with Nebula.
      </p>

      <ul
        aria-label="Workspace benefits"
        className="mb-9 space-y-2.5"
      >
        {BENEFITS.map((benefit) => (
          <li
            key={benefit}
            className="text-[13px] text-foreground/55 leading-none"
          >
            {benefit}
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-5 mb-9">
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 text-[13px] font-medium bg-primary text-primary-foreground px-6 py-3 sm:py-2.5 rounded-xl hover:opacity-90 active:opacity-70 transition-opacity shadow-[0_1px_3px_rgba(26,86,219,0.2)] focus-ring"
        >
          Create Workspace
          <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
        </button>

        <button
          onClick={handleLogin}
          className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-150 focus-ring rounded text-center sm:text-left"
        >
          Sign In
        </button>
      </div>

      <p className="text-[11.5px] text-muted-foreground/40 leading-[1.72] max-w-[440px]">
        Your current understanding remains available during this guest session.
        Creating a workspace preserves it beyond this session.
      </p>
    </motion.section>
  );
}

interface WorkspaceConversionProps {
  phase:      GuestPhase;
  onConvert:  () => void;
  onContinue?: () => void;
  reduced:    boolean;
}

export function WorkspaceConversion({
  phase,
  onConvert,
  reduced,
}: WorkspaceConversionProps) {
  useEffect(() => {
    emit("WORKSPACE_CONVERSION_REVEALED");
  }, []);

  const isConverted = phase === "CONVERTED";

  return (
    <div className="max-w-[720px] mx-auto px-5 sm:px-10 pb-36 sm:pb-44">
      <div className="pt-10 sm:pt-12 border-t border-border">
        <AnimatePresence mode="wait">
          {isConverted ? (
            <ConvertedConfirmation key="converted" reduced={reduced} />
          ) : (
            <InvitationSection key="invite" onConvert={onConvert} reduced={reduced} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
