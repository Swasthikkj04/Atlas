import { type HTMLAttributes } from 'react';

export interface QuietStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Primary calm conclusion */
  title?: string;
  /** Contextual explanation of the quiet status */
  description?: string;
  /** Timestamp of the most recent verification */
  lastVerifiedAt?: string;
  /** Number of stable components verified */
  stableCount?: number;
  /** Compact inline presentation option */
  compact?: boolean;
  className?: string;
}
