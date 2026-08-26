import React from 'react';
import type { ContainerProps } from './Container.types';
import styles from './Container.module.css';

/**
 * Authoritative Container Primitive.
 *
 * Enforces canonical layout boundaries (form, dialog, reading, workspace, fluid)
 * and responsive horizontal margins across the Workspace.
 */
export const Container: React.FC<ContainerProps> = ({
  size = 'workspace',
  as: Component = 'div',
  children,
  className = '',
  ...rest
}) => {
  const sizeClass = styles[size] || styles.workspace;
  return (
    <Component className={`${styles.container} ${sizeClass} ${className}`} {...rest}>
      {children}
    </Component>
  );
};

Container.displayName = 'Container';
