import React from 'react';
import type { BadgeProps } from './Badge.types';
import styles from './Badge.module.css';

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => (
  <span className={`${styles.badge} ${styles[variant]} ${className}`}>
    {children}
  </span>
);

Badge.displayName = 'Badge';
