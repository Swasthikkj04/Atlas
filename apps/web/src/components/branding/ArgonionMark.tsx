import React from 'react';

export interface ArgonionMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  /**
   * Optional color override. Defaults to 'currentColor' for crisp black in light mode and white in dark mode.
   */
  color?: string;
}

/**
 * ArgonionMark — The official isometric 3D brand mark of Argonion (argonion.com).
 * Tightly framed with zero dead margins so the mark fills the icon container completely.
 * Rendered in high-contrast black & white with three-dimensional faceted depth shading.
 */
export const ArgonionMark: React.FC<ArgonionMarkProps> = ({
  size = 20,
  className = '',
  color,
  ...props
}) => {
  const baseColor = color || 'currentColor';

  return (
    <svg
      width={size}
      height={size}
      viewBox="280 155 480 750"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    >
      {/* Left Vertical Facet (Medium Shading) */}
      <path
        d="M303 307.055V763.961L524.877 628.906V172L303 307.055Z"
        fill={baseColor}
        fillOpacity="0.82"
        stroke={baseColor}
        strokeWidth="12"
        strokeLinejoin="round"
      />
      {/* Bottom Ground Facet (Deep Shading) */}
      <path
        d="M550.31 652.585L337.202 785.885L524.877 892L731.845 763.961L550.31 652.585Z"
        fill={baseColor}
        fillOpacity="0.52"
        stroke={baseColor}
        strokeWidth="12"
        strokeLinejoin="round"
      />
      {/* Right Vertical Facet (Full Bright Highlight) */}
      <path
        d="M567.849 618.382V269.345L745 373.705V734.144L567.849 618.382Z"
        fill={baseColor}
        fillOpacity="1.0"
        stroke={baseColor}
        strokeWidth="12"
        strokeLinejoin="round"
      />
    </svg>
  );
};

ArgonionMark.displayName = 'ArgonionMark';
