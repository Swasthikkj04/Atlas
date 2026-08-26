import { type HTMLAttributes } from 'react';

export interface PartialStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Headline title */
  title?: string;
  /** Summary of what Nebula successfully established */
  established: string | string[];
  /** Summary of what could not be established or verified */
  unverified: string | string[];
  /** Optional action to inspect raw evidence or lineage */
  inspectLabel?: string;
  onInspectEvidence?: () => void;
  className?: string;
}
