import { type HTMLAttributes } from 'react';

export type LoadingStateSize = 'sm' | 'md' | 'lg';

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Primary label communicating the operation */
  label?: string;
  /** Optional secondary context */
  description?: string;
  /** Sizing of the indicator */
  size?: LoadingStateSize;
  /** Whether to vertically and horizontally center the component */
  centered?: boolean;
  /** Render compact inline variation */
  inline?: boolean;
  className?: string;
}
