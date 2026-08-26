import React from 'react';
import type { ClusterProps } from './Cluster.types';
import styles from './Cluster.module.css';

/**
 * Authoritative Cluster Primitive.
 *
 * Enforces horizontal inline rhythm and wrapping for closely related UI elements.
 */
export const Cluster: React.FC<ClusterProps> = ({
  gap = 'xs',
  align = 'center',
  justify = 'start',
  wrap = true,
  as: Component = 'div',
  children,
  className = '',
  ...rest
}) => {
  const gapClass = styles[`gap-${gap}`] || styles['gap-xs'];
  const alignClass = styles[`align-${align}`] || styles['align-center'];
  const justifyClass = styles[`justify-${justify}`] || styles['justify-start'];
  const wrapClass = wrap ? styles.wrap : styles.nowrap;

  return (
    <Component
      className={`${styles.cluster} ${gapClass} ${alignClass} ${justifyClass} ${wrapClass} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
};

Cluster.displayName = 'Cluster';
