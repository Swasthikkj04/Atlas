import type { HTMLAttributes } from 'react';

export interface ActiveUnderstandingBannerProps extends HTMLAttributes<HTMLDivElement> {
  readonly domainId: string;
  readonly domainName: string;
  readonly onRetry?: () => void;
}
