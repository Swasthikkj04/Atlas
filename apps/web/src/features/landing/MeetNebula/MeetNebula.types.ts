import { type ReactNode } from 'react';

export interface ClientLogo {
  name: string;
  icon?: ReactNode;
}

export interface MeetNebulaProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  headline?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  clients?: ClientLogo[];
  className?: string;
}
