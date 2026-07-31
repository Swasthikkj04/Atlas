import React from 'react';
import type { StackProps } from './Stack.types';
import styles from './Stack.module.css';

export const Stack: React.FC<StackProps> = ({
  gap = 'md',
  align = 'stretch',
  children,
  className = '',
}) => (
  <div className={`${styles.stack} ${styles[`gap-${gap}`]} ${styles[`align-${align}`]} ${className}`}>
    {children}
  </div>
);

Stack.displayName = 'Stack';
