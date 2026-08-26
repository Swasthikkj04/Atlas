export type DomainIdentitySize = 'primary' | 'secondary' | 'compact';

export interface DomainFaviconProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly domain?: string | null;
  readonly size?: DomainIdentitySize;
  readonly className?: string;
  readonly fallbackIconClassName?: string;
}
