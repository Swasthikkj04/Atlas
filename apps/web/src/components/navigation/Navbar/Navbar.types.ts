import { type ReactNode } from 'react';

export interface NavLinkItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface NavbarProps {
  logoSrc?: string;
  links?: NavLinkItem[];
  loginHref?: string;
  ctaText?: string;
  ctaHref?: string;
  className?: string;
  children?: ReactNode;
}
