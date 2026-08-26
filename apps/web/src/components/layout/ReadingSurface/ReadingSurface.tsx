import React from 'react';
import type { ReadingSurfaceProps } from './ReadingSurface.types';
import styles from './ReadingSurface.module.css';

/**
 * Authoritative ReadingSurface Primitive.
 *
 * Enforces strict 65–75 CPL narrative measure (max-w: 760px) and safe word breaking
 * for executive briefs, story interpretation, and causal explanations.
 */
export const ReadingSurface: React.FC<ReadingSurfaceProps> = ({
  centered = true,
  as: Component = 'article',
  children,
  className = '',
  ...rest
}) => {
  const centerClass = centered ? styles.centered : '';

  return (
    <Component className={`${styles.readingSurface} ${centerClass} ${className}`} {...rest}>
      {children}
    </Component>
  );
};

ReadingSurface.displayName = 'ReadingSurface';
