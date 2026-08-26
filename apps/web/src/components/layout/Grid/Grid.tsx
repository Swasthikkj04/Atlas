import React from 'react';
import type { GridProps } from './Grid.types';
import styles from './Grid.module.css';

/**
 * Authoritative Grid Primitive.
 *
 * Enforces structured 2D layouts with predictable responsive collapsing
 * and canonical gap spacing.
 */
export const Grid: React.FC<GridProps> = ({
  cols = 2,
  gap = 'md',
  minColWidth,
  as: Component = 'div',
  children,
  className = '',
  style,
  ...rest
}) => {
  const colClass = styles[`cols-${cols}`] || styles['cols-2'];
  const gapClass = styles[`gap-${gap}`] || styles['gap-md'];

  const customStyle: React.CSSProperties = {
    ...(minColWidth ? ({ '--min-col-w': minColWidth } as React.CSSProperties) : {}),
    ...style,
  };

  return (
    <Component
      className={`${styles.grid} ${colClass} ${gapClass} ${className}`}
      style={customStyle}
      {...rest}
    >
      {children}
    </Component>
  );
};

Grid.displayName = 'Grid';
