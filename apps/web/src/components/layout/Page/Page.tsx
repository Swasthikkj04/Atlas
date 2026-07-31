import React from 'react';
import type { PageProps } from './Page.types';
import styles from './Page.module.css';

export const Page: React.FC<PageProps> = ({ children, className = '' }) => (
  <div className={`${styles.page} ${className}`}>{children}</div>
);

Page.displayName = 'Page';
