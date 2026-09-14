// ─── Guest Experience Types & Types Model ──────────────────────────────────

export type GuestPhase =
  | "IDLE"          // Hero shown, domain input ready
  | "VALIDATING"    // API call in flight after submission (~300ms)
  | "UNDERSTANDING" // Thinking sequence running
  | "PAUSING"       // SX-002: The Nebula Pause (~520ms of stillness)
  | "UNDERSTOOD"    // Assessment data loaded, sections revealing progressively
  | "CONVERTED"     // User created a workspace
  | "ERROR";        // Understanding failed

export type GuestErrorCode =
  | "NETWORK_FAILURE"
  | "DOMAIN_INSUFFICIENT_SIGNAL"
  | "RATE_LIMIT_EXCEEDED"
  | "PLATFORM_FAILURE"
  | "DATA_LOAD_FAILED"
  | null;

export type TechConfidence = "high" | "medium" | "low";

export interface Technology {
  name:           string;
  role:           string;
  confidence:     TechConfidence;
  category?:      string;
  version?:       string;
  evidenceCount?: number;
}

export type ObservationSeverity   = "critical" | "high" | "medium" | "low" | "informational";
export type Severity = ObservationSeverity;
export type ObservationConfidence = "high" | "medium" | "low";

export interface Observation {
  label:          string;
  body:           string;
  title?:         string;
  description?:   string;
  whyItMatters?:  string;
  severity?:      ObservationSeverity;
  confidence?:    ObservationConfidence;
  evidenceCount?: number;
  category?:      string;
  firstObserved?: string;
}

export interface TimelineEntry {
  date:              string;
  headline:          string;
  narrative:         string;
  observationBasis?: string;
  category?:         string;
}

export interface EvidenceRow {
  id:                   string;
  category:             string;
  title:                string;
  summary:              string;
  source?:              string;
  collectedAt:          string;
  payload:              string;
  hash?:                string;
  collector?:           string;
  target?:              string;
  responseStatus?:      string;
  integrityStatus?:     string;
  relatedTechnologies?: string[];
  relatedObservations?: string[];
}

export interface ExecutiveBriefStats {
  techCount:        number;
  observationCount: number;
  evidenceCount:    number;
  timelineCount:    number;
  criticalCount:    number;
}

export interface ExecutiveBriefData {
  paragraphs: string[];
  stats:      ExecutiveBriefStats;
  briefError?: boolean;
}

export interface AssessmentData {
  brief?: ExecutiveBriefData;
  technologies?: Technology[];
  observations?: Observation[];
  timeline?: TimelineEntry[];
  evidence?: EvidenceRow[];
  jobId?: string;
  sessionId?: string;
  duration?: number;
  domain?: string;
  dns?: {
    a?: string[];
    mx?: string[];
    ns?: string[];
    txt?: string[];
  };
  tls?: {
    version?: string;
    cipher?: string;
    issuer?: string;
    validTo?: string;
  };
  headers?: Record<string, string>;
  infrastructure?: any;
}

export interface GuestState {
  phase:       GuestPhase;
  domain:      string;
  sentenceIdx: number;
  sections:    number;
  data:        AssessmentData | null;
  error:       GuestErrorCode;
}

export interface GuestActions {
  submit:  (domain: string) => void;
  reset:   () => void;
  convert: () => void;
}

export interface GuestMachine {
  state:   GuestState;
  actions: GuestActions;
}
export const ease = [0.4, 0, 0.2, 1] as [number, number, number, number];

export const SENTENCES = [
  "Understanding public infrastructure…",
  "Resolving network relationships…",
  "Identifying deployed technologies…",
  "Connecting infrastructure observations…",
  "Preparing Executive Brief…",
] as const;

export const SENTENCE_DURATIONS: readonly number[] = [1450, 1300, 1400, 1250, 1350];

export const DOMAIN_RE =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export const isValidDomain = (v: string): boolean => DOMAIN_RE.test(v.trim());

export function normalizeDomain(raw: string): string {
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//i, "");
  const slash = d.indexOf("/");
  if (slash !== -1) d = d.slice(0, slash);
  const q = d.indexOf("?");
  if (q !== -1) d = d.slice(0, q);
  const hash = d.indexOf("#");
  if (hash !== -1) d = d.slice(0, hash);
  return d.replace(/\.$/, "");
}

export interface TelemetryStage {
  id: string;
  label: string;
  detail: string;
  category: "DNS" | "TLS" | "HTTP" | "TECH" | "BRIEF";
}

export const TELEMETRY_STAGES: readonly TelemetryStage[] = [
  {
    id: "dns",
    label: "Resolving DNS & Network Topology",
    detail: "Authoritative nameservers, Anycast routing, A/AAAA, MX, and TXT verification records",
    category: "DNS",
  },
  {
    id: "tls",
    label: "Inspecting Edge TLS & Cryptographic Posture",
    detail: "TLS 1.3 protocol negotiation, cipher suites, HSTS enforcement, and certificate authority chains",
    category: "TLS",
  },
  {
    id: "http",
    label: "Analyzing HTTP Response Policies & Perimeter",
    detail: "Content-Security-Policy, X-Frame-Options, anti-clickjacking, and security response headers",
    category: "HTTP",
  },
  {
    id: "tech",
    label: "Fingerprinting Deployed Technologies & Cloud Ingress",
    detail: "Reverse proxies, edge CDNs, server-side frameworks, cloud providers, and caching layers",
    category: "TECH",
  },
  {
    id: "brief",
    label: "Synthesizing Executive Understanding & Evidence Lineage",
    detail: "Correlating observations into canonical findings and generating human-readable architectural brief",
    category: "BRIEF",
  },
] as const;

export interface SampleDomainTarget {
  readonly domain: string;
  readonly label: string;
  readonly category: string;
  readonly highlight: string;
}

export const SAMPLE_DOMAINS: readonly SampleDomainTarget[] = [
  {
    domain: "stripe.com",
    label: "Stripe",
    category: "Fintech Infrastructure",
    highlight: "Cloudflare Edge · AWS Multi-region · Strict HSTS",
  },
  {
    domain: "github.com",
    label: "GitHub",
    category: "Developer Platform",
    highlight: "Global Anycast · Strict SPF · Fastly Edge",
  },
  {
    domain: "cloudflare.com",
    label: "Cloudflare",
    category: "Edge & Security",
    highlight: "Native Anycast · Automated TLS · Zero Origin Exposure",
  },
  {
    domain: "vercel.com",
    label: "Vercel",
    category: "Frontend Cloud",
    highlight: "Serverless Edge · Next.js SSR · Strict TLS 1.3",
  },
  {
    domain: "linear.app",
    label: "Linear",
    category: "Modern SaaS",
    highlight: "Cloudflare CDN · Isolated CSP · React Hydration",
  },
] as const;

// ─── Demo / Presentation Assessment Data ──────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export const DEMO_ASSESSMENT_DATA: AssessmentData = {
  brief: {
    paragraphs: [
      "stripe.com is running a mature, well-considered infrastructure. Cloudflare sits at the edge — absorbing traffic before it reaches origin, handling DDoS mitigation, and serving assets through a global CDN. Behind it, AWS provides the compute substrate, deployed across multiple regions with deliberate redundancy.",
      "The frontend is React, rendered server-side at the edge. Nginx handles the reverse proxy at origin. Nebula found no critical observations. The architecture reflects years of intentional engineering decisions — not reactive ones.",
      "Three observations are worth your attention. None are urgent. All are the kind of thing a careful architect would want to address in the next planning cycle.",
    ],
    stats: {
      techCount:        24,
      observationCount: 3,
      evidenceCount:    7,
      timelineCount:    5,
      criticalCount:    0,
    },
  },
  technologies: [
    {
      name: "Cloudflare",
      role: "Edge Delivery Network handling DDoS mitigation, CDN, and global traffic routing",
      confidence:    "high",
      category:      "CDN",
      evidenceCount: 12,
    },
    {
      name: "Amazon AWS",
      role: "Cloud infrastructure deployed across multiple regions with deliberate redundancy",
      confidence:    "high",
      category:      "Cloud",
      evidenceCount: 8,
    },
    {
      name: "React",
      role: "Frontend Framework, rendered server-side at the edge",
      confidence:    "high",
      category:      "Frontend",
      version:       "18",
      evidenceCount: 6,
    },
    {
      name: "Nginx",
      role: "Reverse Proxy handling origin traffic and load balancing",
      confidence:    "medium",
      category:      "Web Server",
      evidenceCount: 4,
    },
    {
      name: "PostgreSQL",
      role: "Primary Relational Database",
      confidence:    "medium",
      category:      "Database",
      evidenceCount: 3,
    },
    {
      name: "Redis",
      role: "Distributed Cache and session store",
      confidence:    "low",
      category:      "Cache",
      evidenceCount: 2,
    },
    {
      name: "Let's Encrypt",
      role: "TLS Certificate Authority, automated renewal via Cloudflare integration",
      confidence:    "high",
      category:      "Security",
      evidenceCount: 5,
    },
    {
      name: "Stripe JS",
      role: "Payment SDK served from a separate subdomain",
      confidence:    "high",
      category:      "Payments",
      version:       "3",
      evidenceCount: 4,
    },
  ],
  observations: [
    {
      label: "Email authentication policy allows soft-fail delivery",
      body: "The SPF record uses a ~all directive — a soft-fail policy that permits forged messages to reach inboxes rather than rejecting them outright. For a domain handling payment and transactional email at this scale, this represents a meaningful spoofing surface. Tightening to -all is a straightforward change with no service disruption.",
      whyItMatters: "A strict SPF policy helps receiving mail servers identify and reject forged emails that claim to originate from this domain. Soft-fail allows those messages through — reducing the domain's ability to protect its recipients.",
      severity:      "medium",
      confidence:    "high",
      evidenceCount: 8,
      category:      "DNS",
      firstObserved: TODAY,
    },
    {
      label: "Domain is absent from the HSTS Preload List",
      body: "While HSTS headers are present and correctly configured, the domain has not been submitted to the browser HSTS preload list. This means a visitor using an untrusted network for the very first time is briefly exposed to a potential SSL-stripping attack before the HSTS header can take effect. Preload submission is a low-effort change requiring no infrastructure modification.",
      whyItMatters: "Preload inclusion ensures browsers enforce HTTPS before any network connection is made — closing the narrow window where the first request could be intercepted on an untrusted network.",
      severity:      "low",
      confidence:    "high",
      evidenceCount: 5,
      category:      "TLS",
      firstObserved: TODAY,
    },
    {
      label: "No IPv6 addresses configured",
      body: "No AAAA records were detected across the observable DNS configuration. IPv6 adoption continues to grow — particularly on mobile networks and within enterprise environments that have made the transition. The gap is unlikely to affect current traffic in most markets, but it will become progressively more relevant across the next planning cycle.",
      whyItMatters: "Several major mobile carriers and enterprise networks now route IPv6 natively. Infrastructure without AAAA records may encounter latency penalties or routing inefficiencies on those networks.",
      severity:      "informational",
      confidence:    "high",
      evidenceCount: 4,
      category:      "DNS",
      firstObserved: TODAY,
    },
  ],
  timeline: [
    {
      date:     daysAgo(0),
      headline: "Cloudflare is absorbing all inbound traffic",
      narrative:
        "Nebula observed that every publicly routable request reaches Cloudflare before touching origin infrastructure. DNS A records resolve to Cloudflare Anycast addresses — a pattern consistent with deliberate edge adoption rather than incidental use. This is the dominant routing decision shaping every other infrastructure choice.",
      observationBasis: "Supported by DNS, HTTP response headers, and TLS certificate observations",
      category: "Edge Delivery",
    },
    {
      date:     daysAgo(1),
      headline: "TLS configuration reflects a deliberate security posture",
      narrative:
        "TLS 1.3 is enforced at the edge, with HSTS headers present and configured to include subdomains. Nebula did not observe TLS 1.0 or 1.1 negotiation — older protocol support has either been removed or was never present. Certificate renewal appears automated through Cloudflare's managed certificate infrastructure, eliminating a common operational failure mode.",
      observationBasis: "Supported by TLS handshake and HTTP response header observations",
      category: "TLS",
    },
    {
      date:     daysAgo(4),
      headline: "The frontend moved to server-side rendering at the edge",
      narrative:
        "React is deployed with server-side rendering active. Response payloads carry hydration markers consistent with edge rendering rather than client-side bootstrapping. This reflects a decision to prioritise first-paint latency for global visitors — a change that ripples through caching behaviour, CDN configuration, and origin compute cost.",
      observationBasis: "Supported by HTML structure, JavaScript payload, and cache-control observations",
      category: "Frontend",
    },
    {
      date:     daysAgo(9),
      headline: "Payment infrastructure was isolated to a separate subdomain",
      narrative:
        "Stripe JS is served from a dedicated subdomain rather than the primary application domain. This boundary is a meaningful architectural decision — it scopes payment-related Content Security Policy rules and limits the blast radius of any future CSP issue on the main domain. Nebula observed this as a deliberate separation rather than an incidental deployment artifact.",
      observationBasis: "Supported by DNS, CSP policy, and JavaScript origin observations",
      category: "Payments",
    },
    {
      date:     daysAgo(21),
      headline: "Compute expanded across multiple AWS regions",
      narrative:
        "Infrastructure signatures suggest AWS compute is deployed beyond a single region. DNS TTLs and routing patterns are consistent with multi-region redundancy rather than a single availability zone. Redundancy at this level is typically a deliberate architectural choice rather than a default — it reflects a decision to treat infrastructure availability as a product requirement.",
      observationBasis: "Supported by DNS routing, IP geolocation, and HTTP latency pattern observations",
      category: "Cloud",
    },
  ],
  evidence: [
    {
      id:          "ev-001",
      category:    "HTTP Responses",
      title:       "Security response headers observed on primary domain",
      summary:
        "Nebula observed an HTTP response from the primary domain containing a set of security-related response headers. This evidence contributes to multiple infrastructure observations including the edge delivery and TLS posture assessments.",
      source:       "HTTP response",
      collectedAt:  daysAgo(0),
      payload:
`HTTP/2 200
server: cloudflare
cf-ray: 7d3f2a8b4c1e9f0a-LHR
cache-control: public, max-age=31536000, immutable
strict-transport-security: max-age=31536000; includeSubDomains; preload
content-security-policy: default-src 'self'; script-src 'self' 'nonce-Xr7z' js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; frame-ancestors 'none'
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()`,
      hash:                 "sha256-a4f2b8d1c3e5f7a9b0d2e4f6a8c0e2f4a6b8d0e2",
      collector:            "Collector v1.4",
      relatedTechnologies:  ["Cloudflare"],
      relatedObservations:  ["Domain is absent from the HSTS Preload List"],
    },
    {
      id:          "ev-002",
      category:    "HTTP Responses",
      title:       "Payment subdomain response observed with isolated CSP scope",
      summary:
        "Nebula observed an HTTP response from the payment subdomain. The Content Security Policy is narrower in scope than the primary domain — consistent with deliberate payment infrastructure isolation.",
      source:       "HTTP response",
      collectedAt:  daysAgo(0),
      payload:
`HTTP/2 200
server: cloudflare
cf-ray: 7d3f2a8b4c1e9f0b-LHR
cache-control: no-store, no-cache, must-revalidate
strict-transport-security: max-age=63072000; includeSubDomains
content-security-policy: default-src 'none'; script-src 'self' js.stripe.com; frame-ancestors 'self' stripe.com
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN`,
      hash:                "sha256-b5c3d9e1f4a7b2c8d6e0f2a4b6c8d0e2f4a6b8c0",
      collector:           "Collector v1.4",
      relatedTechnologies: ["Stripe JS", "Cloudflare"],
    },
    {
      id:          "ev-003",
      category:    "DNS",
      title:       "A records resolve to Cloudflare Anycast addresses",
      summary:
        "Nebula observed that the primary domain A records resolve to IP addresses within Cloudflare's Anycast range. No origin IP addresses are publicly exposed through DNS.",
      source:       "DNS lookup",
      collectedAt:  daysAgo(0),
      payload:
`; <<>> DiG 9.18 <<>> A stripe.com
;; ANSWER SECTION:
stripe.com.     300  IN  A  104.16.0.0
stripe.com.     300  IN  A  104.16.1.0

;; Addresses are within AS13335 (Cloudflare) Anycast range.
;; Origin IP is not publicly exposed.`,
      hash:                "sha256-c6d4e0f2a5b8c1d7e3f5a7b9c1d3e5f7a9b1c3d5",
      collector:           "Collector v1.4",
      relatedTechnologies: ["Cloudflare", "Amazon AWS"],
    },
    {
      id:          "ev-004",
      category:    "DNS",
      title:       "SPF record uses soft-fail policy directive",
      summary:
        "Nebula observed a DNS TXT record containing an SPF policy that uses a ~all (soft-fail) directive. This permits forged messages to reach inboxes rather than being rejected outright.",
      source:       "DNS lookup",
      collectedAt:  daysAgo(0),
      payload:
`; <<>> DiG 9.18 <<>> TXT stripe.com
;; ANSWER SECTION:
stripe.com.  300  IN  TXT  "v=spf1 include:_spf.google.com include:sendgrid.net ~all"

; Note: ~all = soft-fail. Receiving servers may accept forged messages.
; Recommendation: change to -all to enforce rejection.

stripe.com.  300  IN  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc@stripe.com; ruf=mailto:dmarc@stripe.com; adkim=s; aspf=s"`,
      hash:                "sha256-d7e5f1a3b6c9d2e8f4a6b8c0d2e4f6a8b0c2d4e6",
      collector:           "Collector v1.4",
      relatedObservations: ["Email authentication policy allows soft-fail delivery"],
    },
    {
      id:          "ev-005",
      category:    "TLS Certificates",
      title:       "TLS 1.3 negotiated with HSTS max-age of one year",
      summary:
        "Nebula observed TLS 1.3 negotiated at the edge. The HSTS header instructs browsers to enforce HTTPS for one year and includes subdomains. The domain has not been submitted to the browser HSTS preload list.",
      source:       "TLS handshake",
      collectedAt:  daysAgo(1),
      payload:
`Protocol: TLSv1.3
Cipher: TLS_AES_128_GCM_SHA256
Certificate:
  Subject: CN=*.stripe.com
  Issuer: CN=DigiCert TLS Hybrid ECC SHA384 2020 CA1
  Valid: 2024-01-15 → 2025-02-16
  SANs: stripe.com, *.stripe.com, *.global.stripe.com

HSTS: max-age=31536000; includeSubDomains
Preload: not submitted (hstspreload.org confirms domain absent)`,
      hash:                "sha256-e8f6a2b4c7d0e1f5a3b7c9d1e3f5a7b9c1d3e5f7",
      collector:           "Collector v1.4",
      relatedTechnologies: ["Let's Encrypt", "Cloudflare"],
      relatedObservations: ["Domain is absent from the HSTS Preload List"],
    },
    {
      id:          "ev-006",
      category:    "Technologies",
      title:       "React hydration markers and server-side rendering confirmed",
      summary:
        "Nebula observed HTML response payloads containing React hydration metadata consistent with server-side rendering. React version 18 was inferred from the hydration protocol signature.",
      source:       "HTTP response body",
      collectedAt:  daysAgo(4),
      payload:
`<!-- Observed in HTML response body -->
<script>
  window.__NEXT_DATA__ = {
    "buildId": "xK9mP2vQ",
    "runtimeConfig": {},
    "nextExport": false,
    "autoExport": false,
    "isFallback": false
  }
</script>
<div id="__next">
  <!-- React 18 hydration root detected via _reactFiber internals -->
  <!-- SSR confirmed: content present before JS execution -->
</div>`,
      hash:                "sha256-f9a7b3c5d8e1f4a6b8c0d2e4f6a8b0c2d4e6f8a0",
      collector:           "Collector v1.4",
      relatedTechnologies: ["React", "Nginx"],
    },
    {
      id:          "ev-007",
      category:    "Collector Metadata",
      title:       "Collection session summary",
      summary:
        "Nebula completed a collection session for this domain. Six active collectors were used. All collectors returned results within the expected duration window.",
      source:       "Collector session",
      collectedAt:  daysAgo(0),
      payload:
`Session ID:   ses_${Date.now().toString(36)}
Collectors:   dns-resolver v1.4, http-probe v1.4, tls-inspector v1.4,
              header-analyzer v1.4, cert-fetcher v1.4, body-parser v1.4
Duration:     1,842 ms
Requests:     14 total (12 successful, 2 redirected, 0 failed)
Rate:         Compliant with robots.txt and crawl-delay directives
Note:         All evidence collected from publicly observable endpoints only.
              No authenticated requests were made.`,
      collector: "Collector v1.4",
    },
  ],
};
