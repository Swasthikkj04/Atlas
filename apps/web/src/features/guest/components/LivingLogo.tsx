import { motion } from "motion/react";
import type { GuestPhase } from "../types";

interface LivingLogoProps {
  phase: GuestPhase;
}

const NODES = [
  { cx:  3, cy:  5 },
  { cx: 48, cy:  1 },
  { cx: 88, cy:  7 },
  { cx: 14, cy: 40 },
] as const;

const EDGES = [
  [0, 1],
  [1, 2],
  [0, 3],
] as const;

function linePath(a: typeof NODES[number], b: typeof NODES[number]) {
  return `M ${a.cx} ${a.cy} L ${b.cx} ${b.cy}`;
}

export function LivingLogo({ phase }: LivingLogoProps) {
  const isActive  = phase === "UNDERSTANDING" || phase === "VALIDATING";
  const isPausing = phase === "PAUSING";
  const isSettled = phase === "UNDERSTOOD" || phase === "CONVERTED";

  const nodeOpacity = isActive ? 0.55 : isPausing ? 0.35 : isSettled ? 0.18 : 0.14;
  const lineOpacity = isActive ? 0.22 : isPausing ? 0.14 : 0;

  return (
    <div
      className="relative shrink-0"
      style={{ width: 96, height: 24 }}
    >
      <span className="absolute inset-0 flex items-center text-[12px] font-semibold tracking-[0.24em] text-foreground uppercase select-none pointer-events-none">
        Argonion
      </span>

      <svg
        viewBox="0 0 96 46"
        aria-hidden="true"
        className="pointer-events-none"
        style={{
          position: "absolute",
          top: -11,
          left: -8,
          width: 108,
          height: 52,
          overflow: "visible",
        }}
      >
        {EDGES.map(([i, j], k) => (
          <motion.path
            key={k}
            d={linePath(NODES[i], NODES[j])}
            stroke="currentColor"
            strokeWidth={0.7}
            fill="none"
            className="text-muted-foreground"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: isActive ? 1 : isPausing ? 1 : 0,
              opacity: lineOpacity,
            }}
            transition={{
              pathLength: {
                duration: isActive ? 1.0 + k * 0.28 : 0.5,
                ease: "easeInOut",
              },
              opacity: { duration: 0.45 },
            }}
          />
        ))}

        {NODES.map((node, i) => (
          <motion.circle
            key={i}
            cx={node.cx}
            cy={node.cy}
            r={1.6}
            fill="currentColor"
            className="text-foreground"
            animate={{ opacity: nodeOpacity }}
            transition={{ duration: 0.55, delay: i * 0.06 }}
          />
        ))}
      </svg>
    </div>
  );
}

export default LivingLogo;
