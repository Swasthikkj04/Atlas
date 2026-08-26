import React from 'react';
import type { WorkspaceCanvasProps } from './WorkspaceCanvas.types';

/**
 * Authoritative Workspace Canvas (WX-105 / WX-210).
 *
 * Primary content surface inside WorkspaceShell supporting:
 * - 1440px Workspace boundary (default mode="workspace")
 * - 760px Narrative reading boundary (mode="reading")
 * - 100% Full-bleed boundary (mode="fluid")
 *
 * Guarantees full-width horizontal measure without artificial narrow column collapse.
 */
export const WorkspaceCanvas: React.FC<WorkspaceCanvasProps> = ({
  mode = 'workspace',
  size,
  children,
  className = '',
  ...rest
}) => {
  if (mode === 'reading') {
    return (
      <div className={`w-full max-w-[760px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 ${className}`} {...rest}>
        {children}
      </div>
    );
  }

  const maxWidthClass =
    size === 'fluid' || mode === 'fluid'
      ? 'max-w-full'
      : size === 'reading'
      ? 'max-w-[760px]'
      : 'max-w-[1440px]';

  return (
    <div className={`w-full ${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 ${className}`} {...rest}>
      {children}
    </div>
  );
};

WorkspaceCanvas.displayName = 'WorkspaceCanvas';
