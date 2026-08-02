// BX-010 — Background Constellation Component
import React from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { EASE_CSS } from '../../utils/constants';
import {
  CONSTELLATION_NODES,
  CONSTELLATION_EDGES,
  CONSTELLATION_VIEWBOX,
  type ConstellationNode,
} from './constants/geometry';
import { BRANDING_TOKENS, type ConstellationDensity } from './constants/tokens';

export interface BackgroundConstellationProps {
  /**
   * Optional phase name to derive opacity automatically (e.g. 'IDLE', 'UNDERSTANDING', 'PAUSING', 'ERROR')
   */
  phase?: string;
  /**
   * Number of content sections displayed on page. Opacity fades to 0 when sections >= 1. Default: 0
   */
  sections?: number;
  /**
   * Explicit opacity override. If provided, overrides phase/sections calculation.
   */
  opacity?: number;
  /**
   * Constellation node density preset ('low' | 'medium' | 'high'). Default: 'high'
   */
  density?: ConstellationDensity;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Custom inline styles for wrapper element
   */
  style?: React.CSSProperties;
}

function filterNodesByDensity(nodes: readonly ConstellationNode[], density: ConstellationDensity): readonly ConstellationNode[] {
  if (density === 'low') {
    return nodes.filter((n) => n.id % 2 === 0);
  }
  if (density === 'medium') {
    return nodes.filter((n) => n.id % 4 !== 3);
  }
  return nodes;
}

export const BackgroundConstellation: React.FC<BackgroundConstellationProps> = ({
  phase = 'IDLE',
  sections = 0,
  opacity,
  density = 'high',
  className = '',
  style,
}) => {
  const isReduced = useReducedMotion();
  const [mounted, setMounted] = React.useState<boolean>(false);

  React.useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // Determine target opacity
  const normalizedPhase = phase.toUpperCase();
  const calculatedOpacity =
    sections >= 1
      ? BRANDING_TOKENS.constellation.opacities.hidden
      : normalizedPhase === 'IDLE' || normalizedPhase === 'ERROR'
      ? BRANDING_TOKENS.constellation.opacities.idle
      : BRANDING_TOKENS.constellation.opacities.active;

  const targetOpacity = opacity ?? calculatedOpacity;

  // Filter nodes & edges based on density setting
  const visibleNodes = React.useMemo(() => filterNodesByDensity(CONSTELLATION_NODES, density), [density]);
  const visibleNodeIds = React.useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const nodeMap = React.useMemo(() => new Map(visibleNodes.map((n) => [n.id, n])), [visibleNodes]);

  const visibleEdges = React.useMemo(
    () => CONSTELLATION_EDGES.filter(([i, j]) => visibleNodeIds.has(i) && visibleNodeIds.has(j)),
    [visibleNodeIds]
  );

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
      style={style}
    >
      <svg
        viewBox={CONSTELLATION_VIEWBOX}
        className="w-full h-full text-foreground"
        preserveAspectRatio="xMidYMid slice"
        style={{
          opacity: targetOpacity,
          transitionProperty: 'opacity',
          transitionDuration: isReduced ? '0s' : `${BRANDING_TOKENS.constellation.timing.fadeDuration}s`,
          transitionTimingFunction: EASE_CSS,
        }}
      >
        {/* Connection lines */}
        {visibleEdges.map(([i, j], k) => {
          const a = nodeMap.get(i);
          const b = nodeMap.get(j);
          if (!a || !b) return null;
          return (
            <line
              key={k}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="currentColor"
              strokeWidth={BRANDING_TOKENS.constellation.strokeWidth}
            />
          );
        })}

        {/* Drifting nodes — single one-shot drift animation */}
        {visibleNodes.map((n) => {
          const currentCx = mounted && !isReduced ? n.x + n.dx : n.x;
          const currentCy = mounted && !isReduced ? n.y + n.dy : n.y;

          return (
            <circle
              key={n.id}
              cx={currentCx}
              cy={currentCy}
              r={n.r}
              fill="currentColor"
              style={{
                transitionProperty: 'cx, cy',
                transitionDuration: isReduced ? '0s' : `${n.dur}s`,
                transitionTimingFunction: EASE_CSS,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};

BackgroundConstellation.displayName = 'BackgroundConstellation';
