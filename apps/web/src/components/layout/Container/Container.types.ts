import { type ReactNode, type ElementType, type HTMLAttributes } from 'react';

export type ContainerSize =
  | 'form'
  | 'dialog'
  | 'reading'
  | 'landing'
  | 'content'
  | 'workspace'
  | 'fluid';

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  size?: ContainerSize;
  as?: ElementType;
  children: ReactNode;
  className?: string;
}
