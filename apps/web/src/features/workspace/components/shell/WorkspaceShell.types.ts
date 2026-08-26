import { type ReactNode, type HTMLAttributes } from 'react';

export interface WorkspaceShellProps extends HTMLAttributes<HTMLDivElement> {
  /** Slot for Workspace navigation (sidebar on desktop, drawer on mobile) */
  navigation?: ReactNode;
  /** Slot for top Workspace header landmark */
  header?: ReactNode;
  /** Primary Workspace canvas content */
  children?: ReactNode;
  /** Explicit canvas slot alternative */
  canvas?: ReactNode;
  /** Whether mobile navigation is open (structural reflow support) */
  isNavOpen?: boolean;
  /** Callback to close mobile navigation */
  onNavClose?: () => void;
  className?: string;
}
