import React from 'react';
import type { WorkspaceFooterProps } from './WorkspaceFooter.types';

import { WORKSPACE_SIGNATURE, WORKSPACE_LOCKUP } from '../../contracts/signature-footer.contract';
export { WORKSPACE_SIGNATURE, WORKSPACE_LOCKUP };

/**
 * Authoritative Workspace Signature Footer (WX-210-F).
 *
 * Quiet product mark communicating Nebula's core information philosophy:
 * "Intelligence before data · Context before details · Summary before evidence"
 * Followed by the restrained Nebula / Workspace identity lockup.
 *
 * Conformance invariants:
 * - Small, muted, restrained, spacious, editorial, premium, static
 * - Single-line presentation on normal desktop width, natural wrapping on mobile
 * - Visually subordinate to Workspace intelligence
 * - Zero animations, zero new tokens, zero marketing fluff
 */
export const WorkspaceFooter: React.FC<WorkspaceFooterProps> = ({
  className = '',
  ...rest
}) => {
  return (
    <footer
      aria-label="Workspace Signature"
      className={`w-full mt-16 sm:mt-24 pt-8 pb-12 border-t border-border/40 flex flex-col items-center justify-center text-center space-y-6 ${className}`}
      {...rest}
    >
      {/* Editorial Philosophy Signature */}
      <p className="font-serif text-xs sm:text-[13px] text-muted-foreground/60 tracking-wide leading-relaxed max-w-2xl px-4 select-none">
        {WORKSPACE_SIGNATURE}
      </p>

      {/* Nebula / Workspace Identity Lockup */}
      <div
        className="flex flex-col items-center gap-1 select-none"
        aria-label="Nebula Workspace"
      >
        <span className="font-mono text-[10px] font-semibold tracking-[0.26em] uppercase text-muted-foreground/70">
          NEBULA
        </span>
        <span className="font-mono text-[9px] font-medium tracking-[0.3em] uppercase text-muted-foreground/45">
          WORKSPACE
        </span>
      </div>
    </footer>
  );
};

WorkspaceFooter.displayName = 'WorkspaceFooter';
