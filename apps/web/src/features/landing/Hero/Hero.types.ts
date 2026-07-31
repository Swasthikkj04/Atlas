import { type ReactNode } from 'react';

export interface HeroProps {
  titlePrefix?: string;
  titleHighlight?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  className?: string;
  children?: ReactNode;
}
