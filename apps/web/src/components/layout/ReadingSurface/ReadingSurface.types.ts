import { type ReactNode, type ElementType, type HTMLAttributes } from 'react';

export interface ReadingSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  centered?: boolean;
  children: ReactNode;
  className?: string;
}
