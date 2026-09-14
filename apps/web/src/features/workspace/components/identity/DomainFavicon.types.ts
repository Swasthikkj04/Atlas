export type DomainIdentitySize = 'primary' | 'secondary' | 'compact';

export interface DomainFaviconProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly domain?: string | null;
  readonly size?: DomainIdentitySize;
  readonly className?: string;
  readonly fallbackIconClassName?: string;
}

export function sanitizeDomain(domain: string | null | undefined): string | null {
  if (!domain) return null;
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
}

export function resolveFaviconUrl(domain: string | null | undefined): string | null {
  const clean = sanitizeDomain(domain);
  if (!clean) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(clean)}&sz=64`;
}

export function resolveFaviconUrls(domain: string | null | undefined): string[] {
  const clean = sanitizeDomain(domain);
  if (!clean) return [];
  return [
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(clean)}&sz=64`,
    `https://icons.duckduckgo.com/ip3/${encodeURIComponent(clean)}.ico`,
    `https://${clean}/favicon.ico`,
  ];
}
