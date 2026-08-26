import { type ReactNode, type HTMLAttributes } from 'react';

export interface WorkspaceNavigationRegionProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}
