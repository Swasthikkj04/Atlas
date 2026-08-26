import { type HTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface WorkspaceNavItemProps extends HTMLAttributes<HTMLAnchorElement> {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}
