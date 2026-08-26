import type { LucideIcon, LucideProps } from 'lucide-react';

export type IconSize = 'micro' | 'small' | 'default' | 'medium' | 'large';

export type IconStroke = 'display' | 'ui' | 'micro';

export interface IconProps extends Omit<LucideProps, 'size' | 'strokeWidth' | 'stroke'> {
  /** The Lucide icon component */
  icon: LucideIcon;
  /** Semantic icon size: micro (12px), small (14px), default (16px), medium (20px), large (24px) */
  size?: IconSize | number;
  /** Semantic stroke width: display (1.5), ui (1.75), micro (2.0) */
  stroke?: IconStroke | number;
  /** Custom stroke color string if overriding CSS text color */
  strokeColor?: string;
  /** Accessible label. If omitted, icon is marked as decorative (aria-hidden="true") */
  'aria-label'?: string;
  title?: string;
  className?: string;
}
