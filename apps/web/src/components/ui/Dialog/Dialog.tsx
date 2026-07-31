import React from 'react';
import type { DialogProps } from './Dialog.types';
import styles from './Dialog.module.css';

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.content} ${className}`} onClick={(e) => e.stopPropagation()}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {children}
      </div>
    </div>
  );
};

Dialog.displayName = 'Dialog';
