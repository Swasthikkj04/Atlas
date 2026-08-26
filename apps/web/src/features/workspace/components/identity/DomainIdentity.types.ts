import type { ReactNode } from 'react';
import type { DomainIdentitySize } from './DomainFavicon.types';

export type { DomainIdentitySize };

export interface DomainIdentityProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly domain?: string | null;
  readonly size?: DomainIdentitySize;
  readonly title?: ReactNode;
  readonly subtitle?: ReactNode;
  readonly badge?: ReactNode;
  readonly actions?: ReactNode;
  readonly domainClassName?: string;
  readonly containerClassName?: string;
}
