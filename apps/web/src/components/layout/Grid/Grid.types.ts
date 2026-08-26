import { type ReactNode, type ElementType, type HTMLAttributes } from 'react';

export type GridCols = 1 | 2 | 3 | 4 | 6 | 12 | 'auto-fit' | 'auto-fill';

export type GridGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface GridProps extends HTMLAttributes<HTMLElement> {
  cols?: GridCols;
  gap?: GridGap;
  minColWidth?: string;
  as?: ElementType;
  children: ReactNode;
  className?: string;
}
