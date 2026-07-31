import React from 'react';
import type { ButtonProps } from './Button.types';
import styles from './Button.module.css';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  ...props
}) => {
  const classNames = `${styles.button} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${className}`.trim();

  return (
    <button className={classNames} {...props}>
      {children}
    </button>
  );
};

Button.displayName = 'Button';
