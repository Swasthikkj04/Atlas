import { type HTMLAttributes } from 'react';

export interface UnderstandNowButtonProps extends HTMLAttributes<HTMLDivElement> {
  /** The server-authoritative active domain ID */
  domainId: string;
  /** The domain name for contextual display & screen-reader announcements */
  domainName: string;
  /** Optional callback fired when understanding completes */
  onCompleted?: () => void;
  className?: string;
}
