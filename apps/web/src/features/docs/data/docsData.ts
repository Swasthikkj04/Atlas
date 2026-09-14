export interface DocArticleMeta {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  category: 'FOUNDATIONS' | 'ARCHITECTURE' | 'SECURITY & PROTOCOLS' | 'CONTRACTS';
  description: string;
  readTime: string;
  updatedAt: string;
  badge?: string;
}

export interface SearchResultItem {
  id: string;
  title: string;
  section: string;
  category: string;
  slug: string;
  anchor?: string;
  snippet: string;
  keywords: string[];
}

export const DOC_ARTICLES: DocArticleMeta[] = [
  {
    id: 'understanding-methodology',
    slug: 'understanding-methodology',
    title: 'Infrastructure Understanding Methodology | Nebula Docs',
    shortTitle: 'Understanding Methodology',
    category: 'FOUNDATIONS',
    description: 'Learn how Nebula understands internet-facing infrastructure through its non-intrusive 6-stage discovery methodology.',
    readTime: '7 min read',
    updatedAt: 'Sept 2026',
    badge: 'Core',
  },
  {
    id: 'ingress-topology',
    slug: 'ingress-topology',
    title: '5-Hop Canonical Ingress Flow Architecture | Nebula Docs',
    shortTitle: '5-Hop Ingress Flow',
    category: 'ARCHITECTURE',
    description: 'Understand how Nebula maps multi-tier edge hierarchies from Public Client to Edge CDN, Gateway, App Runtime, and Cloud Origin.',
    readTime: '5 min read',
    updatedAt: 'Sept 2026',
  },
  {
    id: 'behavioral-fingerprinting',
    slug: 'behavioral-fingerprinting',
    title: '8 Infrastructure Categories & Multi-Signal Heuristics | Nebula Docs',
    shortTitle: '8 Infrastructure Categories',
    category: 'ARCHITECTURE',
    description: 'Explore multi-signal attribution across Edge CDNs, Ingress Gateways, Application Frameworks, and Cloud Providers.',
    readTime: '6 min read',
    updatedAt: 'Sept 2026',
  },
  {
    id: 'severity-taxonomy',
    slug: 'severity-taxonomy',
    title: '6-Tier Finding & Severity Taxonomy | Nebula Docs',
    shortTitle: '6-Tier Finding Taxonomy',
    category: 'FOUNDATIONS',
    description: 'Review Nebula’s deterministic 6-tier classification taxonomy across CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL, and POSITIVE findings.',
    readTime: '5 min read',
    updatedAt: 'Sept 2026',
  },
  {
    id: 'workspace-parity',
    slug: 'workspace-parity',
    title: 'Guest Experience vs. Authenticated Workspace Parity | Nebula Docs',
    shortTitle: 'Guest vs. Workspace Parity',
    category: 'FOUNDATIONS',
    description: 'Learn how Nebula guarantees identical intelligence depth between guest explorations and registered enterprise workspaces.',
    readTime: '4 min read',
    updatedAt: 'Sept 2026',
  },
  {
    id: 'security-boundaries',
    slug: 'security-boundaries',
    title: 'SSRF Prevention & Security Boundaries | Nebula Docs',
    shortTitle: 'SSRF & Boundary Isolation',
    category: 'SECURITY & PROTOCOLS',
    description: 'Understand the security boundaries protecting internal networks, preventing cloud metadata SSRF, and guaranteeing cryptographic truth.',
    readTime: '6 min read',
    updatedAt: 'Sept 2026',
  },
];


export const DOCS_SEARCH_INDEX: SearchResultItem[] = [
  {
    id: 'search-methodology-overview',
    title: 'Infrastructure Understanding Overview',
    section: '1. Overview & Vision',
    category: 'Foundations',
    slug: 'understanding-methodology',
    anchor: 'overview',
    snippet: 'Non-intrusive passive discovery pipeline observing public network transit and cryptographic handshakes.',
    keywords: ['methodology', 'passive', 'discovery', 'overview', 'telemetry', 'guest'],
  },
  {
    id: 'search-pipeline-stage1',
    title: 'Stage 1: PROBING_DNS_NETWORK',
    section: '3. The 6-Stage Pipeline',
    category: 'Pipeline',
    slug: 'understanding-methodology',
    anchor: 'pipeline-stages',
    snippet: 'Authoritative nameservers, Anycast routing, root/apex DNS records, and cryptographic DNSSEC verification.',
    keywords: ['dns', 'dnssec', 'anycast', 'nameserver', 'caa', 'mx', 'txt', 'stage 1'],
  },
  {
    id: 'search-pipeline-stage2',
    title: 'Stage 2: ANALYZING_TLS_SECURITY',
    section: '3. The 6-Stage Pipeline',
    category: 'Pipeline',
    slug: 'understanding-methodology',
    anchor: 'pipeline-stages',
    snippet: 'SSL/TLS certificate chains, TLS 1.3 negotiation, ALPN protocols (HTTP/2, HTTP/3), and HSTS transport directives.',
    keywords: ['tls', 'ssl', 'certificate', 'hsts', 'cipher', 'alpn', 'http2', 'http3', 'stage 2'],
  },
  {
    id: 'search-pipeline-stage3',
    title: 'Stage 3: BEHAVIORAL_FINGERPRINTING',
    section: '3. The 6-Stage Pipeline',
    category: 'Pipeline',
    slug: 'understanding-methodology',
    anchor: 'pipeline-stages',
    snippet: 'Multi-signal edge attribution, gateway detection (Nginx/Envoy), and runtime framework evidence.',
    keywords: ['fingerprint', 'edge', 'gateway', 'cloudflare', 'nginx', 'aws', 'stage 3'],
  },
  {
    id: 'search-pipeline-stage4',
    title: 'Stage 4: PERSISTING_SNAPSHOT_DIFF',
    section: '3. The 6-Stage Pipeline',
    category: 'Pipeline',
    slug: 'understanding-methodology',
    anchor: 'pipeline-stages',
    snippet: 'Canonicalization, SHA-256 state fingerprinting, immutable storage, and temporal delta drift forensics.',
    keywords: ['snapshot', 'drift', 'delta', 'sha256', 'diff', 'persistence', 'stage 4'],
  },
  {
    id: 'search-pipeline-stage5',
    title: 'Stage 5: EVALUATING_FINDINGS_ANOMALIES',
    section: '3. The 6-Stage Pipeline',
    category: 'Pipeline',
    slug: 'understanding-methodology',
    anchor: 'pipeline-stages',
    snippet: 'Deterministic rule evaluation, direct origin exposure detection, and 6-tier severity classification.',
    keywords: ['findings', 'anomalies', 'rules', 'severity', 'origin bypass', 'stage 5'],
  },
  {
    id: 'search-pipeline-stage6',
    title: 'Stage 6: SYNTHESIZING_BRIEF',
    section: '3. The 6-Stage Pipeline',
    category: 'Pipeline',
    slug: 'understanding-methodology',
    anchor: 'pipeline-stages',
    snippet: 'Synthesis of the 5-hop ingress flow and multi-paragraph executive architecture narrative.',
    keywords: ['topology', 'brief', 'executive', 'narrative', '5-hop', 'ingress', 'stage 6'],
  },
  {
    id: 'search-ingress-flow',
    title: '5-Hop Ingress Flow Architecture',
    section: '4. 5-Hop Ingress Flow',
    category: 'Architecture',
    slug: 'ingress-topology',
    anchor: 'ingress-topology',
    snippet: 'Deterministic 5-hop hierarchy: Client -> Edge (CDN) -> Gateway -> App -> Cloud Origin.',
    keywords: ['ingress', 'hops', 'edge', 'gateway', 'app', 'cloud', 'client', 'flow'],
  },
  {
    id: 'search-categories-8',
    title: '8 Canonical Infrastructure Categories',
    section: '5. 8 Infrastructure Categories',
    category: 'Architecture',
    slug: 'behavioral-fingerprinting',
    anchor: 'infrastructure-categories',
    snippet: 'Edge & CDN, Ingress Gateways, Application Runtimes, Cloud Platforms, DNS, TLS, Transport Security, Perimeter Hygiene.',
    keywords: ['categories', 'taxonomy', 'classification', 'technology', 'layers'],
  },
  {
    id: 'search-severity-taxonomy',
    title: '6-Tier Severity Taxonomy',
    section: '6. 6-Tier Finding Taxonomy',
    category: 'Taxonomy',
    slug: 'severity-taxonomy',
    anchor: 'severity-taxonomy',
    snippet: 'CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL, and POSITIVE severity definitions and remediation actions.',
    keywords: ['severity', 'critical', 'high', 'medium', 'low', 'info', 'positive', 'remediation'],
  },
  {
    id: 'search-ssrf-boundaries',
    title: 'SSRF & RFC-1918 Network Isolation',
    section: '2. Core Principles & Safety',
    category: 'Security',
    slug: 'security-boundaries',
    anchor: 'core-principles',
    snippet: 'Strict filtering of RFC-1918, loopback, and cloud metadata targets (169.254.169.254).',
    keywords: ['ssrf', 'security', 'isolation', 'metadata', 'rfc1918', 'private ip'],
  },
];

export const FAQ_ITEMS = [
  {
    question: 'Does Nebula execute intrusive vulnerability scans or exploit payloads?',
    answer: 'No. Nebula operates strictly under a passive observation model. It communicates solely through RFC-standard public DNS queries, standard TLS handshakes, and public HTTP transit headers. It never attempts exploit injections, port fuzzing, or credential brute-forcing.',
  },
  {
    question: 'How does Nebula differentiate between Edge CDNs and Origin Servers?',
    answer: 'Nebula correlates multi-signal wire characteristics including Anycast BGP routing, nameserver zone delegations, HTTP response headers (e.g. `CF-Ray`, `X-Amz-Cf-Id`, `X-Cache`), TLS certificate issuer signatures, and cipher negotiation fingerprints to deterministically attribute each hop.',
  },
  {
    question: 'Are Guest Experience assessments kept private?',
    answer: 'Yes. All active guest queries (`/guest?domain=*`) are tagged with `robots: noindex, nofollow` to prevent search engines from indexing user queries. Guest assessments are ephemeral in-memory sessions that do not write to persistent customer workspace databases.',
  },
  {
    question: 'What is the difference between Guest Experience and Authenticated Workspace?',
    answer: 'The underlying intelligence engine is identical: both produce the same 5-hop topology, technology attribution, and 6-tier finding severities. The difference is state persistence: Authenticated Workspaces unlock continuous 24/7 cron probes, historical snapshot diffing, automated drift alerts, team RBAC, and multi-domain portfolio management.',
  },
];
