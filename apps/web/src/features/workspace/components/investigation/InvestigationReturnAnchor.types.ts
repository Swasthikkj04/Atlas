import { type HTMLAttributes } from 'react';
import type { InvestigationContext } from '../../contracts/investigation-continuity.contract';

export interface InvestigationReturnAnchorProps extends HTMLAttributes<HTMLDivElement> {
  /** The active investigation context containing origin metadata */
  context?: Partial<InvestigationContext> | null;
  /** Explicit custom return label override if desired */
  label?: string;
  /** Callback executed when user clicks return button */
  onReturn: () => void;
  /** Optional secondary fallback action if original context is lost */
  onFallback?: () => void;
  /** Whether the original context was detected as lost/fallback */
  isFallback?: boolean;
  /** Fallback reason string */
  fallbackReason?: string;
  className?: string;
}
