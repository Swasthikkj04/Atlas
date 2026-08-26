import { type ReactNode, type HTMLAttributes } from 'react';
import type { ContainerSize } from '../../../../components/layout';

export interface WorkspaceCanvasRegionProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  /** Max content width boundary: form (420px), dialog (640px), reading (760px), workspace (1440px), fluid (100%) */
  size?: ContainerSize;
  className?: string;
}
