import { type ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'outline';
  className?: string;
}
