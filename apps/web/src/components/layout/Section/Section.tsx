import React from 'react';
import type { SectionProps } from './Section.types';
import styles from './Section.module.css';

/**
 * Authoritative Section Primitive.
 *
 * Enforces semantic experience boundaries (e.g. Executive Brief -> Primary Story)
 * and vertical rhythms using canonical tokens.
 */
export const Section: React.FC<SectionProps> = ({
  spacing = 'md',
  border = 'none',
  as: Component = 'section',
  children,
  className = '',
  ...rest
}) => {
  const spacingClass = styles[`spacing-${spacing}`] || styles['spacing-md'];
  const borderClass = styles[`border-${border}`] || styles['border-none'];

  return (
    <Component className={`${styles.section} ${spacingClass} ${borderClass} ${className}`} {...rest}>
      {children}
    </Component>
  );
};

Section.displayName = 'Section';
