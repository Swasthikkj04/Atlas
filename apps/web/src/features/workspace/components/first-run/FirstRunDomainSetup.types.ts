import { type HTMLAttributes } from 'react';
import type { DomainDto } from '../../../../types/api';

export interface FirstRunDomainSetupProps extends HTMLAttributes<HTMLDivElement> {
  /** Callback fired when a new domain is established and initial understanding begins */
  onDomainEstablished?: (domain: DomainDto) => void;
  className?: string;
}
