import { type HTMLAttributes } from 'react';

export interface UnavailableStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Headline title */
  title?: string;
  /** Detailed reason why information is unavailable */
  description?: string;
  /** Contextual technical note */
  technicalNote?: string;
  /** Optional contextual recovery or return action */
  action?: React.ReactNode;
  className?: string;
}
