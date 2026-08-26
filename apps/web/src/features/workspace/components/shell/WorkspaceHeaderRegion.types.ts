import { type ReactNode, type HTMLAttributes } from 'react';

export interface WorkspaceHeaderRegionProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  className?: string;
}
