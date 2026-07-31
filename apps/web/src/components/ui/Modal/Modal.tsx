import React from 'react';
import type { ModalProps } from './Modal.types';
import styles from './Modal.module.css';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={`${styles.modal} ${className}`} onClick={(e) => e.stopPropagation()}>
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </div>
  );
};

Modal.displayName = 'Modal';
