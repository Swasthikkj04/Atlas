import { type ReactNode } from 'react';

export interface InlineProps {
  align?: 'start' | 'center' | 'end';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  children: ReactNode;
  className?: string;
}
