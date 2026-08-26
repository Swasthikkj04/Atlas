import React from 'react';
import { WorkspaceNavigationRegion } from './WorkspaceNavigationRegion';
import { WorkspaceHeaderRegion } from './WorkspaceHeaderRegion';
import { WorkspaceCanvasRegion } from './WorkspaceCanvasRegion';
import type { WorkspaceShellProps } from './WorkspaceShell.types';

/**
 * Authoritative Workspace Shell Architecture (WX-102).
 *
 * Provides the permanent structural environment for Nebula Workspace:
 * - Persistent/Reflowing Navigation Region (Left)
 * - Sticky Header Region (Top)
 * - Canvas Region (#main-content) with 1440px Workspace Boundary
 */
export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  navigation,
  header,
  canvas,
  children,
  isNavOpen = false,
  onNavClose,
  className = '',
  ...rest
}) => {
  return (
    <div
      className={`min-h-screen bg-background text-foreground flex flex-col lg:flex-row relative selection:bg-primary/20 selection:text-foreground ${className}`}
      {...rest}
    >
      {/* 1. Structural Navigation Region */}
      {navigation && (
        <WorkspaceNavigationRegion isOpen={isNavOpen} onClose={onNavClose}>
          {navigation}
        </WorkspaceNavigationRegion>
      )}

      {/* 2. Primary Workspace Region (Header + Canvas) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Header Region */}
        {header && (
          <WorkspaceHeaderRegion>
            {header}
          </WorkspaceHeaderRegion>
        )}

        {/* Canvas Surface Region */}
        <WorkspaceCanvasRegion>
          {canvas || children}
        </WorkspaceCanvasRegion>
      </div>
    </div>
  );
};

WorkspaceShell.displayName = 'WorkspaceShell';
