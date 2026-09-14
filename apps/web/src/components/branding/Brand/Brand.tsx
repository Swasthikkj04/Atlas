import React from 'react';
import type { BrandProps } from './Brand.types';
import { ArgonionMark } from '../ArgonionMark';
import styles from './Brand.module.css';

export const Brand: React.FC<BrandProps> = ({
  showWordmark = true,
  size = 'md',
  className = '',
}) => {
  const dimensions = size === 'sm' ? 20 : size === 'lg' ? 28 : 24;

  return (
    <a href="/" className={`${styles.brand} ${styles[size]} ${className}`} aria-label="Argonion landing page">
      <ArgonionMark size={dimensions} className={styles.logo} />
      {showWordmark && <span className={styles.wordmark}>ARGONION</span>}
    </a>
  );
};

Brand.displayName = 'Brand';
