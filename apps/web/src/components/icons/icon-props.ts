import type { IconProps, IconSize, IconStroke } from './Icon.types.ts';

export const ICON_SIZE_MAP: Record<IconSize, number> = {
  micro: 12,
  small: 14,
  default: 16,
  medium: 20,
  large: 24,
};

export const ICON_STROKE_MAP: Record<IconStroke, number> = {
  display: 1.5,
  ui: 1.75,
  micro: 2.0,
};

export interface ResolvedIconProps {
  size: number;
  strokeWidth: number;
  className: string;
  color?: string;
  stroke?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  role?: string;
  title?: string;
  [key: string]: unknown;
}

/**
 * Resolves raw Icon component properties into sanitized Lucide SVG element props.
 *
 * Guarantees:
 * - stroke is never set to undefined (preventing transparent stroke bug)
 * - sizes resolve to canonical pixel dimensions
 * - stroke context follows semantic display/ui/micro thresholds
 * - decorative icons receive aria-hidden="true"
 */
export function resolveIconProps(props: IconProps): ResolvedIconProps {
  const rawSize = props.size ?? 'default';
  const rawStroke = props.stroke ?? 'ui';
  const strokeColor = props.strokeColor;
  const ariaLabel = props['aria-label'];
  const title = props.title;
  const className = props.className || '';

  const numericSize: number =
    typeof rawSize === 'number'
      ? rawSize
      : (typeof rawSize === 'string' && rawSize in ICON_SIZE_MAP
          ? ICON_SIZE_MAP[rawSize as IconSize]
          : ICON_SIZE_MAP.default);

  const numericStroke: number =
    typeof rawStroke === 'number'
      ? rawStroke
      : numericSize >= 24
      ? ICON_STROKE_MAP.display
      : numericSize <= 14
      ? ICON_STROKE_MAP.micro
      : (typeof rawStroke === 'string' && rawStroke in ICON_STROKE_MAP
          ? ICON_STROKE_MAP[rawStroke as IconStroke]
          : ICON_STROKE_MAP.ui);

  const hasAccessibleName = Boolean(ariaLabel || title);

  const resolved: ResolvedIconProps = {
    size: numericSize,
    strokeWidth: numericStroke,
    className,
  };

  for (const [key, val] of Object.entries(props)) {
    if (
      key !== 'icon' &&
      key !== 'size' &&
      key !== 'stroke' &&
      key !== 'strokeColor' &&
      key !== 'aria-label' &&
      key !== 'title' &&
      key !== 'className'
    ) {
      resolved[key] = val;
    }
  }

  // Only attach stroke / color if explicitly provided to prevent overriding Lucide's default stroke="currentColor"
  if (strokeColor) {
    resolved.color = strokeColor;
    resolved.stroke = strokeColor;
  }

  if (hasAccessibleName) {
    resolved['aria-label'] = ariaLabel;
    if (title) resolved.title = title;
    resolved.role = 'img';
  } else {
    resolved['aria-hidden'] = true;
  }

  return resolved;
}
