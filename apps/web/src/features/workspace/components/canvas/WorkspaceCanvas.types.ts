import { type ReactNode, type HTMLAttributes } from 'react';
import type { ContainerSize } from '../../../../components/layout';

export type WorkspaceCanvasMode = 'workspace' | 'reading' | 'fluid';

export interface WorkspaceCanvasProps extends HTMLAttributes<HTMLDivElement> {
  /** Content width boundary mode: 'workspace' (1440px), 'reading' (760px), or 'fluid' (100%) */
  mode?: WorkspaceCanvasMode;
  /** Explicit container size override */
  size?: ContainerSize;
  children?: ReactNode;
  className?: string;
}
