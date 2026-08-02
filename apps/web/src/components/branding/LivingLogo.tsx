// BX-001 — Living Logo Platform Component
import React from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { EASE_CSS } from '../../utils/constants';
import {
  LIVING_LOGO_NODES,
  LIVING_LOGO_EDGES,
  LIVING_LOGO_VIEWBOX,
  type LivingLogoNode,
} from './constants/geometry';
import { BRANDING_TOKENS } from './constants/tokens';

export type LivingLogoVisualState = 'idle' | 'active' | 'pausing' | 'settled' | string;

export interface LivingLogoProps {
  /**
   * Animation / lifecycle phase string (e.g. 'IDLE', 'VALIDATING', 'UNDERSTANDING', 'PAUSING', 'UNDERSTOOD', 'CONVERTED', 'ERROR')
   */
  phase?: string;
  /**
   * Alternative normalized state designation ('idle' | 'active' | 'pausing' | 'settled')
   */
  state?: LivingLogoVisualState;
  /**
   * Custom wordmark text displayed in the logo (Default: 'Argonion')
   */
  wordmarkText?: string;
  /**
   * Whether to show wordmark text alongside constellation (Default: true)
   */
  showWordmark?: boolean;
  /**
   * Container width in pixels (Default: 76)
   */
  width?: number;
  /**
   * Container height in pixels (Default: 18)
   */
  height?: number;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Additional inline styles
   */
  style?: React.CSSProperties;
}

function getLinePath(a: LivingLogoNode, b: LivingLogoNode): string {
  return `M ${a.cx} ${a.cy} L ${b.cx} ${b.cy}`;
}

export const LivingLogo: React.FC<LivingLogoProps> = ({
  phase,
  state,
  wordmarkText = 'Argonion',
  showWordmark = true,
  width = BRANDING_TOKENS.logo.dimensions.width,
  height = BRANDING_TOKENS.logo.dimensions.height,
  className = '',
  style,
}) => {
  const isReduced = useReducedMotion();

  // Normalize phase or state prop to determine current visual state tier
  const currentStatus = (state || phase || 'IDLE').toUpperCase();

  const isActive =
    currentStatus === 'UNDERSTANDING' ||
    currentStatus === 'VALIDATING' ||
    currentStatus === 'ACTIVE';

  const isPausing = currentStatus === 'PAUSING';

  const isSettled =
    currentStatus === 'UNDERSTOOD' ||
    currentStatus === 'CONVERTED' ||
    currentStatus === 'SETTLED';

  const { opacities, timing, nodeRadius, strokeWidth, dimensions } = BRANDING_TOKENS.logo;

  const nodeOpacity = isActive
    ? opacities.activeNode
    : isPausing
    ? opacities.pausingNode
    : isSettled
    ? opacities.settledNode
    : opacities.idleNode;

  const lineOpacity = isActive ? opacities.activeLine : isPausing ? opacities.pausingLine : opacities.idleLine;

  const showLines = isActive || isPausing;

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width, height, ...style }}
    >
      {/* Wordmark — perfectly still, always */}
      {showWordmark && (
        <span className="absolute inset-0 flex items-center text-[10px] font-semibold tracking-[0.28em] text-foreground uppercase select-none pointer-events-none">
          {wordmarkText}
        </span>
      )}

      {/* Constellation overlay */}
      <svg
        viewBox={LIVING_LOGO_VIEWBOX}
        aria-hidden="true"
        className="pointer-events-none"
        style={{
          position: 'absolute',
          top: dimensions.svgTopOffset,
          left: dimensions.svgLeftOffset,
          width: dimensions.svgWidth,
          height: dimensions.svgHeight,
          overflow: 'visible',
        }}
      >
        {/* Connection lines */}
        {LIVING_LOGO_EDGES.map(([i, j], k) => {
          const pathD = getLinePath(LIVING_LOGO_NODES[i], LIVING_LOGO_NODES[j]);
          const lineDuration = isReduced
            ? 0
            : isActive
            ? timing.lineDurationBase + k * timing.lineDurationStagger
            : timing.lineResetDuration;

          return (
            <path
              key={k}
              d={pathD}
              pathLength={100}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              className="text-muted-foreground"
              style={{
                strokeDasharray: 100,
                strokeDashoffset: showLines ? 0 : 100,
                opacity: lineOpacity,
                transitionProperty: 'stroke-dashoffset, opacity',
                transitionDuration: `${lineDuration}s, ${timing.lineOpacityDuration}s`,
                transitionTimingFunction: EASE_CSS,
              }}
            />
          );
        })}

        {/* Nodes */}
        {LIVING_LOGO_NODES.map((node, i) => {
          const nodeDelay = isReduced ? 0 : i * timing.nodeDelayStagger;

          return (
            <circle
              key={i}
              cx={node.cx}
              cy={node.cy}
              r={nodeRadius}
              fill="currentColor"
              className="text-foreground"
              style={{
                opacity: nodeOpacity,
                transitionProperty: 'opacity',
                transitionDuration: isReduced ? '0s' : `${timing.nodeDuration}s`,
                transitionDelay: `${nodeDelay}s`,
                transitionTimingFunction: EASE_CSS,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};

LivingLogo.displayName = 'LivingLogo';
