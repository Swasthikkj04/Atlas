import { type ReactNode, type HTMLAttributes } from 'react';

export type SectionVariant = 'hero' | 'default' | 'large';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  variant?: SectionVariant;
  children: ReactNode;
  className?: string;
}
