import { type HTMLAttributes, type ReactNode } from 'react';
import type { DomainDto } from '../../../../types/api';

export interface ReturningWorkspaceEntryProps extends HTMLAttributes<HTMLDivElement> {
  /** The verified active domain context */
  activeDomain: DomainDto;
  /** All available domains owned by the user */
  availableDomains?: readonly DomainDto[];
  /** Callback to switch active domain */
  onSelectDomain?: (domainId: string) => void;
  /** Callback to navigate to contextual Infrastructure Memory view */
  onViewMemory?: () => void;
  /** Callback to navigate to contextual Infrastructure Overview view */
  onViewOverview?: () => void;
  /** Custom intelligence slot (e.g. CurrentIntelligence) */
  children?: ReactNode;
  className?: string;
}
