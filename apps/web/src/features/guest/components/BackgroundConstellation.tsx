import type { GuestPhase } from "../types";

interface BackgroundConstellationProps {
  phase:    GuestPhase;
  sections: number;
}

const NODES = [
  { id: 0, x:  95, y:  48, r: 1.5 },
  { id: 1, x: 258, y:  82, r: 2.0 },
  { id: 2, x: 428, y:  36, r: 1.2 },
  { id: 3, x: 585, y:  68, r: 1.2 },
  { id: 4, x: 138, y: 205, r: 1.2 },
  { id: 5, x: 362, y: 224, r: 2.0 },
  { id: 6, x: 508, y: 180, r: 1.2 },
  { id: 7, x:  72, y: 338, r: 1.0 },
  { id: 8, x: 298, y: 315, r: 1.2 },
  { id: 9, x: 574, y: 292, r: 1.0 },
];

const EDGES = [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [8, 6]];

export function BackgroundConstellation({ phase, sections }: BackgroundConstellationProps) {
  const isQuiet = sections >= 1 || (phase !== "IDLE" && phase !== "ERROR");
  const targetOpacity = isQuiet ? 0 : 0.04;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 640 400"
        className="w-full h-full text-foreground transition-opacity duration-500 ease-out"
        style={{ opacity: targetOpacity }}
        preserveAspectRatio="xMidYMid slice"
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
              strokeWidth={0.5}
            />
          );
        })}

        {NODES.map((n) => (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill="currentColor"
          />
        ))}
      </svg>
    </div>
  );
}

export default BackgroundConstellation;
