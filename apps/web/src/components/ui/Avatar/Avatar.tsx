import React from 'react';
import type { AvatarProps } from './Avatar.types';
import styles from './Avatar.module.css';

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'A',
  size = 'md',
  className = '',
}) => {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={`${styles.avatar} ${styles[size]} ${className}`}>
      {src ? <img src={src} alt={name} className={styles.img} /> : initial}
    </div>
  );
};

Avatar.displayName = 'Avatar';
