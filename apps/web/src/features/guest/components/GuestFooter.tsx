import { motion, AnimatePresence } from "motion/react";
import type { GuestPhase } from "../types";

interface GuestFooterProps {
  phase: GuestPhase;
}

export function GuestFooter({ phase }: GuestFooterProps) {
  return (
    <AnimatePresence>
      {phase === "IDLE" && (
        <motion.footer
          role="contentinfo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="text-center text-[12px] text-muted-foreground/55 pb-16 sm:pb-20 pt-8"
        >
          No account required · Guest understanding expires after 24 hours
        </motion.footer>
      )}
    </AnimatePresence>
  );
}

export default GuestFooter;
