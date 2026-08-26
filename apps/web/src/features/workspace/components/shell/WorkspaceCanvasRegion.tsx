import React from 'react';
import type { WorkspaceCanvasRegionProps } from './WorkspaceCanvasRegion.types';

/**
 * Authoritative Workspace Canvas Region (WX-102 / WX-210).
 *
 * Establishes the primary structural main landmark area where
 * Workspace intelligence experiences will be rendered.
 * Strictly targets #main-content for skip-link accessibility.
 */
export const WorkspaceCanvasRegion: React.FC<WorkspaceCanvasRegionProps> = ({
  children,
  className = '',
  ...rest
}) => {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      role="main"
      className={`flex-1 min-w-0 w-full flex flex-col focus:outline-none ${className}`}
      {...rest}
    >
      {children}
    </main>
  );
};

WorkspaceCanvasRegion.displayName = 'WorkspaceCanvasRegion';
