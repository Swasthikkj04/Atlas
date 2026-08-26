import { type HTMLAttributes } from 'react';

export interface WorkspaceBreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  /** Active domain context (e.g. stripe.com) */
  domain?: string | null;
  /** Primary workspace section name (default: 'Workspace') */
  sectionName?: string;
  /** Optional secondary subsection (e.g. 'Infrastructure Memory') */
  subSection?: string | null;
  className?: string;
}
