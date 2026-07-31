import { type ReactNode } from 'react';

export type StackGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface StackProps {
  gap?: StackGap;
  align?: 'start' | 'center' | 'end' | 'stretch';
  children: ReactNode;
  className?: string;
}
