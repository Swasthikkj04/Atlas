import { motion, AnimatePresence } from "motion/react";
import type { GuestPhase } from "../../types";

interface LivingSignatureProps {
  phase: GuestPhase;
}

function resolveStatus(phase: GuestPhase): string | null {
  switch (phase) {
    case "VALIDATING":
    case "UNDERSTANDING":
    case "PAUSING":
      return "Understanding infrastructure…";
    case "UNDERSTOOD":
    case "CONVERTED":
      return "Infrastructure understood.";
    default:
      return null;
  }
}

export function LivingSignature({ phase }: LivingSignatureProps) {
  const status = resolveStatus(phase);

  return (
    <div className="mt-7 flex flex-col items-center gap-0.5" aria-hidden="true">
      {/* Product name */}
      <p className="font-display italic text-[11px] text-foreground/28 tracking-[0.01em] leading-none select-none">
        Nebula
      </p>

      {/* Brand line */}
      <p className="text-[9.5px] text-muted-foreground/30 tracking-[0.16em] uppercase leading-none select-none">
        by Argonion
      </p>

      {/* Evolving status — SX-006 Calm Language */}
      <div className="h-[14px] flex items-center mt-1.5">
        <AnimatePresence mode="wait">
          {status && (
            <motion.p
              key={status}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display italic text-[10.5px] text-muted-foreground/38 tracking-[0.01em] leading-none select-none"
            >
              {status}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
