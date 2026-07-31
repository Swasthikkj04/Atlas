import React from 'react';
import type { BrandProps } from './Brand.types';
import styles from './Brand.module.css';

export const Brand: React.FC<BrandProps> = ({
  showWordmark = true,
  size = 'md',
  className = '',
}) => {
  const dimensions = size === 'sm' ? 20 : size === 'lg' ? 28 : 24;

  return (
    <a href="/" className={`${styles.brand} ${styles[size]} ${className}`} aria-label="Argonion landing page">
      <svg
        width={dimensions}
        height={dimensions}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.logo}
      >
        <path d="M12 2L2 22h20L12 2z" fill="var(--accent-primary)" />
      </svg>
      {showWordmark && <span className={styles.wordmark}>ARGONION</span>}
    </a>
  );
};

Brand.displayName = 'Brand';
