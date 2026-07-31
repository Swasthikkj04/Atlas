import React from 'react';
import type { SpinnerProps } from './Spinner.types';
import styles from './Spinner.module.css';

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => (
  <div className={`${styles.spinner} ${styles[size]} ${className}`} aria-label="Loading" />
);

Spinner.displayName = 'Spinner';
