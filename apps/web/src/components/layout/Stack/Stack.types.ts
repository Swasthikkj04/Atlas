import { type ReactNode, type ElementType, type HTMLAttributes } from 'react';

export type StackGap =
  | 'none'
  | '3xs'
  | '2xs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl';

export type StackAlign = 'start' | 'center' | 'end' | 'stretch';

export interface StackProps extends HTMLAttributes<HTMLElement> {
  gap?: StackGap;
  align?: StackAlign;
  as?: ElementType;
  children: ReactNode;
  className?: string;
}
