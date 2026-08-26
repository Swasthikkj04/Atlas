import React from 'react';
import { Icon } from '../../../../components/icons';
import type { WorkspaceNavItemProps } from './WorkspaceNavItem.types';

/**
 * Authoritative Workspace Navigation Item (WX-103).
 *
 * Implements route-aware, accessible, visually restrained navigation link.
 * Communicates active state cleanly using Phase 0 tokens without visual competition.
 */
export const WorkspaceNavItem: React.FC<WorkspaceNavItemProps> = ({
  label,
  href,
  icon,
  isActive = false,
  onClick,
  className = '',
  ...rest
}) => {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`
        group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150
        focus-ring
        ${
          isActive
            ? 'bg-muted/80 text-foreground font-medium shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 font-normal'
        }
        ${className}
      `}
      {...rest}
    >
      {/* Active Left Indicator */}
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-primary"
        />
      )}

      <Icon
        icon={icon}
        size="default"
        className={`transition-colors duration-150 ${
          isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
        }`}
      />

      <span className="truncate">{label}</span>
    </a>
  );
};

WorkspaceNavItem.displayName = 'WorkspaceNavItem';
