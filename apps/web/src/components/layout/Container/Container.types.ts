import { type ReactNode } from 'react';

export type ContainerSize = 'sm' | 'content' | 'landing' | 'workspace';

export interface ContainerProps {
  size?: ContainerSize;
  children: ReactNode;
  className?: string;
}
