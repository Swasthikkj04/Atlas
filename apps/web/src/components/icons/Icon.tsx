import React from 'react';
import type { IconProps } from './Icon.types';
import { resolveIconProps } from './icon-props';

/**
 * Authoritative Icon Component for Nebula.
 *
 * Enforces canonical Lucide-React usage, semantic sizing,
 * stroke context mapping, and accessibility defaults.
 */
export const Icon: React.FC<IconProps> = (props) => {
  const { icon: IconComponent } = props;
  const resolvedProps = resolveIconProps(props);

  return React.createElement(IconComponent, resolvedProps);
};

Icon.displayName = 'Icon';
