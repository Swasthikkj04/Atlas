import React from 'react';
import type { WorkspaceHeaderRegionProps } from './WorkspaceHeaderRegion.types';

/**
 * Authoritative Workspace Header Region (WX-102 / WX-500-SHELL-02).
 *
 * Establishes the structural 72px top landmark above the Workspace canvas:
 * - Height: 72px (h-[72px])
 * - Horizontal padding: 32px (px-4 sm:px-8)
 * - Border bottom: 1px (border-b)
 * - Shadow: none
 */
export const WorkspaceHeaderRegion: React.FC<WorkspaceHeaderRegionProps> = ({
  children,
  className = '',
  ...rest
}) => {
  return (
    <header
      role="banner"
      className={`
        sticky top-0 z-[100] h-[72px]
        border-b border-border/80 bg-background/80 backdrop-blur-md
        flex items-center justify-between px-4 sm:px-8
        flex-shrink-0 shadow-none
        ${className}
      `}
      {...rest}
    >
      {children}
    </header>
  );
};

WorkspaceHeaderRegion.displayName = 'WorkspaceHeaderRegion';
