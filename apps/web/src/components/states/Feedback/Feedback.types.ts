import { type ReactNode, type HTMLAttributes } from 'react';

export type FeedbackSeverity = 'info' | 'success' | 'warning' | 'error';

export interface FeedbackProps extends HTMLAttributes<HTMLDivElement> {
  /** Severity level consuming WX-002 tokens */
  severity?: FeedbackSeverity;
  /** Primary message */
  title?: string;
  /** Detailed narrative or description */
  description?: string;
  /** Optional dismiss callback */
  onDismiss?: () => void;
  /** Custom children */
  children?: ReactNode;
  className?: string;
}
