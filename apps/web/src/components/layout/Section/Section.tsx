import React from 'react';
import type { SectionProps } from './Section.types';
import styles from './Section.module.css';

export const Section: React.FC<SectionProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => (
  <section className={`${styles.section} ${styles[variant]} ${className}`} {...props}>
    {children}
  </section>
);

Section.displayName = 'Section';
