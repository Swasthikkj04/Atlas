// BX-001 — Living Logo
//
// A small constellation of 4 nodes and 3 connecting lines positioned around
// the ARGONION wordmark. Nodes are always faintly present. Lines draw in
// during UNDERSTANDING and freeze during PAUSING (SX-002). The wordmark itself
// never moves.
//
// SVG coordinate space: 96×46 viewBox with 10px left/right padding,
// 14px top padding, 14px bottom padding beyond the text container.

import { motion } from "motion/react";
import type { GuestPhase } from "./types";

interface LivingLogoProps {
  phase: GuestPhase;
}

// Nodes positioned around the wordmark in SVG coordinate space.
// The wordmark occupies approximately x: 10–86, y: 14–32.
const NODES = [
  { cx:  3, cy:  5 },  // 0 — top-left
  { cx: 48, cy:  1 },  // 1 — above center
  { cx: 88, cy:  7 },  // 2 — top-right
  { cx: 14, cy: 40 },  // 3 — below-left
] as const;

const EDGES = [
  [0, 1],  // top-left  → above-center
  [1, 2],  // above-center → top-right
  [0, 3],  // top-left  → below-left
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
      style={{ width: 76, height: 18 }}
    >
      {/* Wordmark — perfectly still, always */}
      <span className="absolute inset-0 flex items-center text-[10px] font-semibold tracking-[0.28em] text-foreground uppercase select-none pointer-events-none">
        Argonion
      </span>

      {/* Constellation — extends 10px left/right, 14px top/bottom */}
      <svg
        viewBox="0 0 96 46"
        aria-hidden="true"
        className="pointer-events-none"
        style={{
          position: "absolute",
          top: -14,
          left: -10,
          width: 96,
          height: 46,
          overflow: "visible",
        }}
      >
        {/* Connection lines — draw in during UNDERSTANDING */}
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

        {/* Nodes — always present, brighten during UNDERSTANDING */}
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
