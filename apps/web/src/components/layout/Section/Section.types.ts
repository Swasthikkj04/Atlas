import { type ReactNode, type ElementType, type HTMLAttributes } from 'react';

export type SectionSpacing = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export type SectionVariant = SectionSpacing | 'default' | 'subtle' | 'elevated';

export type SectionBorder = 'none' | 'top' | 'bottom' | 'both';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  spacing?: SectionSpacing;
  variant?: SectionVariant;
  border?: SectionBorder;
  as?: ElementType;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}
