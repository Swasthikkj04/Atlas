import { type ReactNode, type HTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Clear title communicating that nothing exists yet */
  title: string;
  /** Explanatory description */
  description?: string;
  /** Optional visual landmark icon */
  icon?: LucideIcon;
  /** Primary action label */
  actionLabel?: string;
  /** Primary action callback */
  onAction?: () => void;
  /** Secondary action label */
  secondaryActionLabel?: string;
  /** Secondary action callback */
  onSecondaryAction?: () => void;
  /** Additional custom actions or content */
  children?: ReactNode;
  className?: string;
}
