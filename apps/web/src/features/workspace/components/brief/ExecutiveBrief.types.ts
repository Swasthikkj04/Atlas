import { type HTMLAttributes } from 'react';
import type { InfrastructureBriefDto } from '../../../../types/api';

export interface ExecutiveBriefProps extends HTMLAttributes<HTMLDivElement> {
  /** The active domain ID to fetch and display the brief for */
  domainId: string;
  /** The domain name for display */
  domainName: string;
  /** Optional pre-loaded brief override */
  initialBrief?: InfrastructureBriefDto | null;
  /** Callback fired when user navigates into a specific highlight/story */
  onSelectHighlight?: (highlightId: string) => void;
  className?: string;
}
