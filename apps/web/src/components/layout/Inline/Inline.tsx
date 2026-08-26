import React from 'react';
import { Cluster } from '../Cluster/Cluster';
import type { ClusterProps } from '../Cluster/Cluster.types';

export type InlineProps = ClusterProps;

/**
 * Backward-compatible alias for Cluster layout primitive.
 */
export const Inline: React.FC<InlineProps> = (props) => <Cluster {...props} />;

Inline.displayName = 'Inline';
