import { type ReactNode, type HTMLAttributes } from 'react';
import type { UserDto, DomainDto } from '../../../../types/api';

export interface WorkspaceHeaderProps extends HTMLAttributes<HTMLElement> {
  /** Active domain context if selected */
  domain?: string | null;
  /** All configured domains for context switching */
  domains?: readonly DomainDto[];
  /** Active domain ID */
  activeDomainId?: string | null;
  /** Domain switch callback */
  onSelectDomain?: (domainId: string) => void;
  /** Add domain callback */
  onAddDomain?: () => void;
  /** Delete domain callback */
  onDeleteDomain?: (domain: DomainDto) => void;
  /** Primary workspace section name (default: 'Workspace') */
  sectionName?: string;
  /** Optional secondary subsection name (e.g. 'Infrastructure Memory') */
  subSection?: string | null;
  /** Whether mobile navigation drawer is currently open */
  isNavOpen?: boolean;
  /** Callback to toggle mobile navigation drawer */
  onToggleNav?: () => void;
  /** Current authenticated user */
  user?: UserDto | null;
  /** Logout callback */
  onLogout?: () => void;
  /** Active theme */
  theme?: 'light' | 'dark' | 'system';
  /** Theme toggle callback */
  onToggleTheme?: () => void;
  /** Global search trigger callback */
  onOpenSearch?: () => void;
  /** Contextual actions slot on the right side */
  actions?: ReactNode;
  className?: string;
}
