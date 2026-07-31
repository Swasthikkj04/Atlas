import React from 'react';
import type { ShellProps } from './Shell.types';
import styles from './Shell.module.css';

export const Shell: React.FC<ShellProps> = ({ children, className = '' }) => (
  <div className={`${styles.shell} ${className}`}>{children}</div>
);

Shell.displayName = 'Shell';
