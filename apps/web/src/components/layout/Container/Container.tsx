import React from 'react';
import type { ContainerProps } from './Container.types';
import styles from './Container.module.css';

export const Container: React.FC<ContainerProps> = ({
  size = 'landing',
  children,
  className = '',
}) => (
  <div className={`${styles.container} ${styles[size]} ${className}`}>
    {children}
  </div>
);

Container.displayName = 'Container';
