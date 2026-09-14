/**
 * SEO-000: Authoritative Public Surface Indexation & Crawlability Matrix
 * 
 * Defines the canonical inventory of all public and private routes,
 * specifying search engine indexability, robot directives, and canonical URLs.
 */

export interface SurfaceRoutePolicy {
  path: string;
  isPublic: boolean;
  isIndexable: boolean;
  isCrawlable: boolean;
  robotsDirective: 'index, follow' | 'noindex, nofollow' | 'noindex, follow';
  canonicalUrl: string;
  category: 'landing' | 'docs' | 'legal' | 'auth' | 'guest' | 'workspace' | 'settings' | 'admin';
  description: string;
}

export const CANONICAL_ORIGIN = 'https://argonion.com';

export const SURFACE_INDEXATION_INVENTORY: SurfaceRoutePolicy[] = [
  // 1. Landing & Marketing Root
  {
    path: '/',
    isPublic: true,
    isIndexable: true,
    isCrawlable: true,
    robotsDirective: 'index, follow',
    canonicalUrl: `${CANONICAL_ORIGIN}/`,
    category: 'landing',
    description: 'Primary landing page and public introduction to Nebula by Argonion.',
  },

  // 2. Public Documentation Pages
  {
    path: '/docs',
    isPublic: true,
    isIndexable: true,
    isCrawlable: true,
    robotsDirective: 'index, follow',
    canonicalUrl: `${CANONICAL_ORIGIN}/docs`,
    category: 'docs',
    description: 'Public documentation index and understanding methodology guide.',
  },
  {
    path: '/docs/understanding-methodology',
    isPublic: true,
    isIndexable: true,
    isCrawlable: true,
    robotsDirective: 'index, follow',
    canonicalUrl: `${CANONICAL_ORIGIN}/docs/understanding-methodology`,
    category: 'docs',
    description: 'Detailed 6-stage discovery pipeline and telemetry methodology guide.',
  },
  {
    path: '/docs/ingress-topology',
    isPublic: true,
    isIndexable: true,
    isCrawlable: true,
    robotsDirective: 'index, follow',
    canonicalUrl: `${CANONICAL_ORIGIN}/docs/ingress-topology`,
    category: 'docs',
    description: '5-Hop Canonical Ingress Flow Architecture specification.',
  },
  {
    path: '/docs/behavioral-fingerprinting',
    isPublic: true,
    isIndexable: true,
    isCrawlable: true,
    robotsDirective: 'index, follow',
    canonicalUrl: `${CANONICAL_ORIGIN}/docs/behavioral-fingerprinting`,
    category: 'docs',
    description: '8 Canonical Infrastructure Categories and multi-signal heuristics.',
  },
  {
    path: '/docs/severity-taxonomy',
    isPublic: true,
    isIndexable: true,
    isCrawlable: true,
    robotsDirective: 'index, follow',
    canonicalUrl: `${CANONICAL_ORIGIN}/docs/severity-taxonomy`,
    category: 'docs',
    description: '6-Tier Finding & Severity Classification Taxonomy.',
  },
  {
    path: '/docs/workspace-parity',
    isPublic: true,
    isIndexable: true,
    isCrawlable: true,
    robotsDirective: 'index, follow',
    canonicalUrl: `${CANONICAL_ORIGIN}/docs/workspace-parity`,
    category: 'docs',
    description: 'Guest Experience vs Authenticated Workspace Parity matrix.',
  },
  {
    path: '/docs/security-boundaries',
    isPublic: true,
    isIndexable: true,
    isCrawlable: true,
    robotsDirective: 'index, follow',
    canonicalUrl: `${CANONICAL_ORIGIN}/docs/security-boundaries`,
    category: 'docs',
    description: 'SSRF prevention, RFC-1918 isolation, and cryptographic boundary guarantees.',
  },

  // 3. Legal & Privacy
  {
    path: '/privacy',
    isPublic: true,
    isIndexable: true,
    isCrawlable: true,
    robotsDirective: 'index, follow',
    canonicalUrl: `${CANONICAL_ORIGIN}/privacy`,
    category: 'legal',
    description: 'Argonion Privacy Policy and data processing terms.',
  },
  {
    path: '/terms',
    isPublic: true,
    isIndexable: true,
    isCrawlable: true,
    robotsDirective: 'index, follow',
    canonicalUrl: `${CANONICAL_ORIGIN}/terms`,
    category: 'legal',
    description: 'Argonion Terms of Service and usage commitments.',
  },

  // 4. Guest Interactive Experience (Ephemeral queries must NOT be indexed)
  {
    path: '/guest',
    isPublic: true,
    isIndexable: false,
    isCrawlable: false,
    robotsDirective: 'noindex, nofollow',
    canonicalUrl: `${CANONICAL_ORIGIN}/guest`,
    category: 'guest',
    description: 'Interactive guest domain analysis surface; ephemeral visitor queries are excluded from search indexes.',
  },

  // 5. Auth & Onboarding (Excluded from index to prevent search result dilution)
  {
    path: '/login',
    isPublic: true,
    isIndexable: false,
    isCrawlable: false,
    robotsDirective: 'noindex, nofollow',
    canonicalUrl: `${CANONICAL_ORIGIN}/login`,
    category: 'auth',
    description: 'Account authentication portal.',
  },
  {
    path: '/register',
    isPublic: true,
    isIndexable: false,
    isCrawlable: false,
    robotsDirective: 'noindex, nofollow',
    canonicalUrl: `${CANONICAL_ORIGIN}/register`,
    category: 'auth',
    description: 'Workspace creation and account registration portal.',
  },

  // 6. Private Application & Authenticated Surfaces (Strictly Private & Disallowed)
  {
    path: '/workspace',
    isPublic: false,
    isIndexable: false,
    isCrawlable: false,
    robotsDirective: 'noindex, nofollow',
    canonicalUrl: `${CANONICAL_ORIGIN}/workspace`,
    category: 'workspace',
    description: 'Authenticated tenant workspace console.',
  },
  {
    path: '/settings',
    isPublic: false,
    isIndexable: false,
    isCrawlable: false,
    robotsDirective: 'noindex, nofollow',
    canonicalUrl: `${CANONICAL_ORIGIN}/settings`,
    category: 'settings',
    description: 'Tenant organization and security settings console.',
  },
  {
    path: '/admin',
    isPublic: false,
    isIndexable: false,
    isCrawlable: false,
    robotsDirective: 'noindex, nofollow',
    canonicalUrl: `${CANONICAL_ORIGIN}/admin`,
    category: 'admin',
    description: 'Internal operator administrative console.',
  },
];

/**
 * Returns all canonical indexable URLs intended for sitemap.xml
 */
export function getIndexableSitemapUrls(): string[] {
  return SURFACE_INDEXATION_INVENTORY
    .filter((route) => route.isIndexable)
    .map((route) => route.canonicalUrl);
}
