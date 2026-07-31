import React from 'react';
import type { InlineProps } from './Inline.types';
import styles from './Inline.module.css';

export const Inline: React.FC<InlineProps> = ({
  align = 'center',
  justify = 'start',
  wrap = true,
  children,
  className = '',
}) => (
  <div className={`${styles.inline} ${styles[`align-${align}`]} ${styles[`justify-${justify}`]} ${wrap ? styles.wrap : ''} ${className}`}>
    {children}
  </div>
);

Inline.displayName = 'Inline';
