import React from 'react';
import type { InputProps } from './Input.types';
import styles from './Input.module.css';

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={`${styles.input} ${className}`} {...props} />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

Input.displayName = 'Input';
