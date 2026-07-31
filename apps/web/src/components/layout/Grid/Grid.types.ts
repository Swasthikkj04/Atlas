import { type ReactNode } from 'react';

export interface GridProps {
  cols?: number;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  className?: string;
}
