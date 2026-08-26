import React from 'react';
import type { DividerProps } from './Divider.types';
import styles from './Divider.module.css';

/**
 * Authoritative Divider Primitive.
 *
 * Restrained structural separator consuming canonical hairline border tokens.
 */
export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  spacing = 'none',
  className = '',
  ...rest
}) => {
  const orientationClass = styles[orientation] || styles.horizontal;
  const spacingClass = styles[`spacing-${spacing}`] || styles['spacing-none'];

  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={`${styles.divider} ${orientationClass} ${spacingClass} ${className}`}
        {...rest}
      />
    );
  }

  return (
    <hr
      className={`${styles.divider} ${orientationClass} ${spacingClass} ${className}`}
      {...rest}
    />
  );
};

Divider.displayName = 'Divider';
