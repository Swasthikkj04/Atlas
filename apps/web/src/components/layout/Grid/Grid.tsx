import React from 'react';
import type { GridProps } from './Grid.types';
import styles from './Grid.module.css';

export const Grid: React.FC<GridProps> = ({
  cols = 12,
  gap = 'md',
  children,
  className = '',
}) => (
  <div
    className={`${styles.grid} ${styles[`gap-${gap}`]} ${className}`}
    style={{ '--grid-cols': cols } as React.CSSProperties}
  >
    {children}
  </div>
);

Grid.displayName = 'Grid';
