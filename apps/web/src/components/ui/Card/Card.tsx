import React, { type ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`${styles.card} ${className}`}>{children}</div>
);

Card.displayName = 'Card';
