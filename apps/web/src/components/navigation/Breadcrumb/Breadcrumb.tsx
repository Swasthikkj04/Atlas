import React from 'react';
import type { BreadcrumbProps } from './Breadcrumb.types';
import styles from './Breadcrumb.module.css';

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => (
  <nav aria-label="Breadcrumb" className={`${styles.breadcrumb} ${className}`}>
    {items.map((item, idx) => (
      <React.Fragment key={idx}>
        {idx > 0 && <span className={styles.separator}>/</span>}
        {item.href ? (
          <a href={item.href} className={styles.item}>{item.label}</a>
        ) : (
          <span className={styles.item}>{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

Breadcrumb.displayName = 'Breadcrumb';
