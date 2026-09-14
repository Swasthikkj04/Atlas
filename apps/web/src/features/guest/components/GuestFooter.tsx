import { motion, AnimatePresence } from "motion/react";
import type { GuestPhase } from "../types";

interface GuestFooterProps {
  phase: GuestPhase;
}

export function GuestFooter({ phase }: GuestFooterProps) {
  // In IDLE phase, Zones D & E are contained inside the primary viewport canvas (GX-R005)
  if (phase === "IDLE") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.footer
        role="contentinfo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-center font-mono text-xs text-[#5F625F] dark:text-muted-foreground pb-16 sm:pb-20 pt-8"
      >
        Current intelligence &bull; No account required
      </motion.footer>
    </AnimatePresence>
  );
}

export default GuestFooter;
