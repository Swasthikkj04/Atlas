import { motion } from "motion/react";
import type { GuestPhase } from "../types";

interface BackgroundConstellationProps {
  phase:    GuestPhase;
  sections: number;
}

const NODES = [
  { id: 0, x:  95, y:  48, r: 2.0, dx:  4, dy: -3, dur: 18 },
  { id: 1, x: 258, y:  82, r: 2.5, dx: -3, dy:  4, dur: 22 },
  { id: 2, x: 428, y:  36, r: 1.5, dx:  5, dy:  2, dur: 16 },
  { id: 3, x: 585, y:  68, r: 1.5, dx: -4, dy: -2, dur: 24 },
  { id: 4, x: 138, y: 205, r: 1.5, dx:  2, dy:  5, dur: 20 },
  { id: 5, x: 362, y: 224, r: 2.5, dx: -5, dy: -3, dur: 19 },
  { id: 6, x: 508, y: 180, r: 1.5, dx:  3, dy: -4, dur: 23 },
  { id: 7, x:  72, y: 338, r: 1.0, dx: -2, dy:  3, dur: 17 },
  { id: 8, x: 298, y: 315, r: 1.5, dx:  4, dy: -5, dur: 21 },
  { id: 9, x: 574, y: 292, r: 1.0, dx: -2, dy:  4, dur: 25 },
];

const EDGES = [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [8, 6]];

export function BackgroundConstellation({ phase, sections }: BackgroundConstellationProps) {
  const targetOpacity =
    sections >= 1  ? 0 :
    phase === "IDLE"   ? 0.05 :
    phase === "ERROR"  ? 0.05 :
    0.03;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      <motion.svg
        viewBox="0 0 640 400"
        className="w-full h-full text-foreground"
        preserveAspectRatio="xMidYMid slice"
        animate={{ opacity: targetOpacity }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      >
        {EDGES.map(([i, j], k) => {
          const a = NODES[i];
          const b = NODES[j];
          return (
            <line
              key={k}
              x1={a.x} y1={a.y}
              x2={b.x} y2={b.y}
              stroke="currentColor"
              strokeWidth={0.6}
            />
          );
        })}

        {NODES.map((n) => (
          <motion.circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill="currentColor"
            animate={{ cx: n.x + n.dx, cy: n.y + n.dy }}
            transition={{ duration: n.dur, ease: "easeInOut" }}
          />
        ))}
      </motion.svg>
    </div>
  );
}

export default BackgroundConstellation;
