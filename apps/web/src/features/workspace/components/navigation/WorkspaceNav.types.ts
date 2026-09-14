import { type HTMLAttributes } from 'react';
import type { UserDto, DomainDto } from '../../../../types/api';

export type WorkspaceNavigationTab =
  | 'overview'
  | 'findings'
  | 'changes'
  | 'infrastructure'
  | 'security'
  | 'memory';

export interface WorkspaceNavProps extends HTMLAttributes<HTMLDivElement> {
  activeView?: WorkspaceNavigationTab;
  onSelectView?: (view: WorkspaceNavigationTab) => void;
  activeDomainId?: string | null;
  domains?: readonly DomainDto[];
  onSelectDomain?: (domainId: string) => void;
  onAddDomain?: () => void;
  onDeleteDomain?: (domain: DomainDto) => void;
  onItemClick?: () => void;
  currentPath?: string;
  user?: UserDto | null;
  className?: string;
}
