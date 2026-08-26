import React from 'react';
import type { WorkspaceBreadcrumbsProps } from './WorkspaceBreadcrumbs.types';

/**
 * Authoritative Workspace Breadcrumbs (WX-104 / WX-500-SHELL-02).
 *
 * Provides contextual location orientation without layout overflow:
 * WORKSPACE / domain [/ subSection]
 */
export const WorkspaceBreadcrumbs: React.FC<WorkspaceBreadcrumbsProps> = ({
  domain,
  sectionName = 'Workspace',
  subSection,
  className = '',
  ...rest
}) => {
  return (
    <nav aria-label="Breadcrumbs" className={`flex items-center min-w-0 ${className}`} {...rest}>
      <ol className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
        <li className="flex items-center flex-shrink-0">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            {sectionName}
          </span>
        </li>

        {domain && (
          <>
            <li aria-hidden="true" className="text-muted-foreground/40 font-mono flex-shrink-0">
              /
            </li>
            <li className="min-w-0 flex items-center">
              <span
                className="font-mono text-xs text-foreground/90 truncate max-w-[140px] sm:max-w-[200px] md:max-w-[300px]"
                title={domain}
              >
                {domain}
              </span>
            </li>
          </>
        )}

        {subSection && (
          <>
            <li aria-hidden="true" className="text-muted-foreground/40 font-mono flex-shrink-0">
              /
            </li>
            <li className="min-w-0 flex items-center">
              <span
                className="font-mono text-xs text-muted-foreground truncate"
                title={subSection}
              >
                {subSection}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
};

WorkspaceBreadcrumbs.displayName = 'WorkspaceBreadcrumbs';
