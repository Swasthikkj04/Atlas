import { type ReactNode, type ElementType, type HTMLAttributes } from 'react';

export type ClusterGap = '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ClusterAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';

export type ClusterJustify = 'start' | 'center' | 'end' | 'between' | 'around';

export interface ClusterProps extends HTMLAttributes<HTMLElement> {
  gap?: ClusterGap;
  align?: ClusterAlign;
  justify?: ClusterJustify;
  wrap?: boolean;
  as?: ElementType;
  children: ReactNode;
  className?: string;
}
