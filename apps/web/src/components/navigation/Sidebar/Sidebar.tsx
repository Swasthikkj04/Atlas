import React from 'react';
import type { SidebarProps } from './Sidebar.types';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC<SidebarProps> = ({ children, className = '' }) => (
  <aside className={`${styles.sidebar} ${className}`}>{children}</aside>
);

Sidebar.displayName = 'Sidebar';
