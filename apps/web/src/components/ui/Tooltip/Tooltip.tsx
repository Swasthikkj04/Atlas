import React from 'react';
import type { TooltipProps } from './Tooltip.types';
import styles from './Tooltip.module.css';

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => (
  <div className={`${styles.container} ${className}`}>
    {children}
    <span className={styles.tooltip}>{content}</span>
  </div>
);

Tooltip.displayName = 'Tooltip';
