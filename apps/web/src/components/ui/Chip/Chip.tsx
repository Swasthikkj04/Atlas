import React from 'react';
import type { ChipProps } from './Chip.types';
import styles from './Chip.module.css';

export const Chip: React.FC<ChipProps> = ({ children, onRemove, className = '' }) => (
  <span className={`${styles.chip} ${className}`}>
    {children}
    {onRemove && (
      <button type="button" onClick={onRemove} className={styles.removeBtn} aria-label="Remove">
        &times;
      </button>
    )}
  </span>
);

Chip.displayName = 'Chip';
