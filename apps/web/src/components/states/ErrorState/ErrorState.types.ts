import { type HTMLAttributes } from 'react';
import { ApiError } from '../../../lib/api-client';

export type ErrorType =
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'not-found'
  | 'rate-limit'
  | 'insufficient-signal'
  | 'generic';

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  /** The error instance or error type */
  error?: Error | ApiError | null;
  /** Explicit override for error type */
  type?: ErrorType;
  /** Explicit title override */
  title?: string;
  /** Explicit message/description override */
  description?: string;
  /** Reference error ID */
  errorId?: string;
  /** Primary retry or recovery action */
  retryLabel?: string;
  onRetry?: () => void;
  /** Secondary action */
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}
