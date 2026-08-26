import React from 'react';
import type { StackProps } from './Stack.types';
import styles from './Stack.module.css';

/**
 * Authoritative Stack Primitive.
 *
 * Enforces canonical vertical rhythm using the Base-8 / Base-4 spatial scale.
 */
export const Stack: React.FC<StackProps> = ({
  gap = 'md',
  align = 'stretch',
  as: Component = 'div',
  children,
  className = '',
  ...rest
}) => {
  const gapClass = styles[`gap-${gap}`] || styles['gap-md'];
  const alignClass = styles[`align-${align}`] || styles['align-stretch'];

  return (
    <Component className={`${styles.stack} ${gapClass} ${alignClass} ${className}`} {...rest}>
      {children}
    </Component>
  );
};

Stack.displayName = 'Stack';
