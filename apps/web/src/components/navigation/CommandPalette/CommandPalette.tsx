import React from 'react';
import type { CommandPaletteProps } from './CommandPalette.types';
import styles from './CommandPalette.module.css';

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.palette} onClick={onClose}>
      <div className={`${styles.box} ${className}`} onClick={(e) => e.stopPropagation()}>
        <input placeholder="Type a command or search..." autoFocus />
      </div>
    </div>
  );
};

CommandPalette.displayName = 'CommandPalette';
