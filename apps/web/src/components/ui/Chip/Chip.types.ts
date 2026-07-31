import { type ReactNode } from 'react';

export interface ChipProps {
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
}
