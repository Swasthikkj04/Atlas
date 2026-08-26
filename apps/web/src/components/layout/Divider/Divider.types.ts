import { type HTMLAttributes } from 'react';

export type DividerOrientation = 'horizontal' | 'vertical';

export type DividerSpacing = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface DividerProps extends HTMLAttributes<HTMLHRElement | HTMLDivElement> {
  orientation?: DividerOrientation;
  spacing?: DividerSpacing;
  className?: string;
}
