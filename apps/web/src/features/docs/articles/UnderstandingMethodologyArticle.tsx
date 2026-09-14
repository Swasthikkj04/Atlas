import React from 'react';
import { ArrowRight } from 'lucide-react';
import { HeadingAnchor } from '../components/HeadingAnchor';
import { InteractivePipelineVisualizer } from '../components/InteractivePipelineVisualizer';
import { IngressTopologyVisualizer } from '../components/IngressTopologyVisualizer';
import { SeverityTaxonomyVisualizer } from '../components/SeverityTaxonomyVisualizer';
import { CodeBlock } from '../components/CodeBlock';
import { DocsPlaygroundCard } from '../components/DocsPlaygroundCard';
import { DocsFaq } from '../components/DocsFaq';

const API_SAMPLE_SNIPPETS = [
  {
    language: 'bash',
    label: 'cURL',
    code: `curl -X POST https://api.argonion.com/api/v1/guest/understand \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "stripe.com"}'`,
  },
  {
    language: 'typescript',
    label: 'TypeScript SDK',
    code: `import { NebulaClient } from '@nebula/sdk';

const client = new NebulaClient();
const result = await client.guest.understandDomain({
  domain: 'stripe.com',
  onStageChange: (stage) => console.log('Current stage:', stage.stageLabel),
});

console.log('5-Hop Ingress Flow:', result.topology.ingressHops);
console.log('Findings:', result.findings.map(f => [f.severity, f.title]));`,
  },
  {
    language: 'python',
    label: 'Python SDK',
    code: `from nebula import NebulaClient

client = NebulaClient()
job = client.guest.understand("stripe.com")

for event in job.stream_stages():
    print(f"[{event.stage}] {event.details}")

report = job.get_result()
print(f"Attributed Technologies: {len(report.technologies)}")`,
  },
  {
    language: 'json',
    label: 'JSON Response',
    code: `{
  "jobId": "und_01j7x8k2m9p4",
  "domain": "stripe.com",
  "status": "COMPLETED",
  "topology": {
    "hops": [
      { "role": "CLIENT", "name": "Public Client" },
      { "role": "EDGE", "name": "Cloudflare Anycast CDN" },
      { "role": "GATEWAY", "name": "Nginx Ingress Proxy" },
      { "role": "APP", "name": "React / Node.js" },
      { "role": "CLOUD", "name": "Amazon Web Services" }
    ]
  },
  "findingsSummary": {
    "critical": 0,
    "high": 0,
    "medium": 1,
    "low": 2,
    "informational": 4,
    "positive": 3
  }
}`,
  },
];

export const UnderstandingMethodologyArticle: React.FC = () => {
  return (
    <article className="space-y-12 pb-12">
      {/* 4. Article Header & Strong Editorial Hierarchy */}
      <header className="space-y-3.5 border-b border-border pb-8">
        <span className="font-mono text-xs text-muted-foreground/80 tracking-wider uppercase block">
          Foundations · Discovery Engine
        </span>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-foreground leading-[1.15]">
          Infrastructure Understanding Methodology & Discovery Engine
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl font-sans pt-1">
          The authoritative technical guide to Nebula&apos;s non-intrusive discovery pipeline, passive wire telemetry, 5-hop ingress topology reconstruction, and deterministic security posture classification.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground/70">
          <span>7 min read</span>
          <span>·</span>
          <span>Updated Sep 2026</span>
          <span>·</span>
          <span>Argonion Engineering</span>
        </div>

        {/* Quiet metadata line without marketing pills */}
        <div className="pt-2 text-xs font-mono text-muted-foreground/60">
          Non-intrusive observation · No simulated telemetry · Network boundary isolation
        </div>
      </header>

      {/* Section 1: Overview */}
      <section className="space-y-4">
        <HeadingAnchor id="overview" level={2}>
          1. Overview & Vision
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          Nebula transforms raw internet-facing perimeter signals into structured, causal infrastructure intelligence.
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          Unlike legacy vulnerability scanners that rely on intrusive port fuzzing or synthetic simulation scripts, Nebula executes a <strong>non-intrusive, passive discovery pipeline</strong>. It observes public network transit, cryptographic handshakes, and wire-level protocol signatures to reconstruct an organization&apos;s actual perimeter topology.
        </p>

        {/* 7. Editorial Callout */}
        <div className="my-6 border-l-2 border-foreground/30 pl-4 py-2 space-y-1 bg-muted/15 rounded-r max-w-prose">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
            Core Guest Experience Invariant
          </span>
          <p className="text-xs text-foreground/85 italic leading-relaxed">
            Nebula lets anyone understand their infrastructure before asking them to create a Workspace. The difference is persistence, not intelligence.
          </p>
        </div>
      </section>

      {/* 8. Restrained Live Example Probe */}
      <DocsPlaygroundCard />

      {/* Section 2: Core Principles */}
      <section className="space-y-4">
        <HeadingAnchor id="core-principles" level={2}>
          2. Core Principles & Safety Invariants
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          Nebula operates under non-negotiable architectural boundaries defined in the product contracts:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="p-4 rounded-md bg-card border border-border space-y-1.5">
            <h3 className="text-xs font-serif font-bold text-foreground">Passive Observation Only</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Communicates strictly through RFC-compliant public DNS queries, TLS handshakes, and standard HTTP headers. Zero exploit probing or vulnerability injection.
            </p>
          </div>

          <div className="p-4 rounded-md bg-card border border-border space-y-1.5">
            <h3 className="text-xs font-serif font-bold text-foreground">Deterministic Ground Truth</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every observation is backed by verifiable cryptographic certs, DNS record chains, or raw response headers. No fabricated or simulated narrative summaries.
            </p>
          </div>

          <div className="p-4 rounded-md bg-card border border-border space-y-1.5">
            <h3 className="text-xs font-serif font-bold text-foreground">SSRF & Perimeter Isolation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enforces strict RFC-1918 private IP, loopback, and cloud metadata filters (<code className="text-[11px] font-mono">169.254.169.254</code>), preventing internal pivoting. Read the <a href="/docs/security-boundaries" className="text-primary hover:underline">Security Boundaries specification</a>.
            </p>
          </div>

          <div className="p-4 rounded-md bg-card border border-border space-y-1.5">
            <h3 className="text-xs font-serif font-bold text-foreground">Canonical Workspace Parity</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If an observation generates a <code className="text-[11px] font-mono font-medium">HIGH</code> severity in Workspace, the Guest Workspace produces the exact same severity. Read the <a href="/docs/workspace-parity" className="text-primary hover:underline">Workspace Parity matrix</a>.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: The 6-Stage Pipeline */}
      <section className="space-y-4">
        <HeadingAnchor id="pipeline-stages" level={2}>
          3. The 6-Stage Understanding Pipeline
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          When a target domain is submitted, the backend worker executes six deterministic pipeline stages. Inspect the interactive visualizer below to explore live telemetry probes, outputs, and safety invariants:
        </p>

        {/* Interactive 6-Stage Visualizer */}
        <InteractivePipelineVisualizer />
      </section>

      {/* Section 4: Ingress Topology */}
      <section className="space-y-4">
        <HeadingAnchor id="ingress-topology" level={2}>
          4. 5-Hop Canonical Ingress Flow Architecture
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          Modern edge architectures deploy multi-layer ingress hierarchies where requests traverse Anycast CDNs, reverse proxy gateways, and application runtimes before reaching origin cloud resources. Read the comprehensive <a href="/docs/ingress-topology" className="text-primary hover:underline">5-Hop Ingress Flow Architecture specification</a> or explore the topology below:
        </p>

        {/* Ingress Topology Component */}
        <IngressTopologyVisualizer />
      </section>

      {/* Section 5: Infrastructure Categories */}
      <section className="space-y-4">
        <HeadingAnchor id="infrastructure-categories" level={2}>
          5. 8 Canonical Infrastructure Categories
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          Nebula maps all discovered technologies, runtime markers, and infrastructure perimeter components into 8 authoritative classifications. Refer to the <a href="/docs/behavioral-fingerprinting" className="text-primary hover:underline">Behavioral Fingerprinting guide</a> for complete attribution heuristics:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 rounded-md bg-muted/20 border border-border space-y-1">
            <span className="font-mono text-[11px] text-foreground font-semibold uppercase">1. Edge & CDN Routing</span>
            <p className="text-muted-foreground leading-relaxed">Anycast routing, DDoS mitigation, and edge caching (Cloudflare, CloudFront, Fastly, Akamai).</p>
          </div>
          <div className="p-3 rounded-md bg-muted/20 border border-border space-y-1">
            <span className="font-mono text-[11px] text-foreground font-semibold uppercase">2. Ingress Gateways</span>
            <p className="text-muted-foreground leading-relaxed">Reverse proxies, load balancers, and ingress controllers (Nginx, Envoy, HAProxy, Apache, Caddy).</p>
          </div>
          <div className="p-3 rounded-md bg-muted/20 border border-border space-y-1">
            <span className="font-mono text-[11px] text-foreground font-semibold uppercase">3. Application Frameworks</span>
            <p className="text-muted-foreground leading-relaxed">Frontend/backend runtimes and UI frameworks (React, Next.js, Node.js, Django, Go, Java, .NET).</p>
          </div>
          <div className="p-3 rounded-md bg-muted/20 border border-border space-y-1">
            <span className="font-mono text-[11px] text-foreground font-semibold uppercase">4. Cloud Platforms</span>
            <p className="text-muted-foreground leading-relaxed">Underlying cloud compute, serverless backends, and hosting providers (AWS, GCP, Azure, Vercel).</p>
          </div>
          <div className="p-3 rounded-md bg-muted/20 border border-border space-y-1">
            <span className="font-mono text-[11px] text-foreground font-semibold uppercase">5. DNS Architecture</span>
            <p className="text-muted-foreground leading-relaxed">Authoritative nameservers, Anycast zones, DNSSEC root trust, and CAA record policies.</p>
          </div>
          <div className="p-3 rounded-md bg-muted/20 border border-border space-y-1">
            <span className="font-mono text-[11px] text-foreground font-semibold uppercase">6. TLS & Cryptography</span>
            <p className="text-muted-foreground leading-relaxed">Certificate Authority issuers, SAN coverage, TLS 1.3 negotiation, and cipher suite hygiene.</p>
          </div>
          <div className="p-3 rounded-md bg-muted/20 border border-border space-y-1">
            <span className="font-mono text-[11px] text-foreground font-semibold uppercase">7. Transport Security</span>
            <p className="text-muted-foreground leading-relaxed">Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), and cookie directive scoping.</p>
          </div>
          <div className="p-3 rounded-md bg-muted/20 border border-border space-y-1">
            <span className="font-mono text-[11px] text-foreground font-semibold uppercase">8. Perimeter Hygiene</span>
            <p className="text-muted-foreground leading-relaxed">Origin IP exposure isolation, actuator/debug endpoint protections, and leak prevention.</p>
          </div>
        </div>
      </section>

      {/* Section 6: Finding Taxonomy */}
      <section className="space-y-4">
        <HeadingAnchor id="severity-taxonomy" level={2}>
          6. 6-Tier Finding & Severity Taxonomy
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          Observations evaluated by the finding rule engine are categorized under a deterministic 6-tier severity scale. For deep remediation profiles, see the <a href="/docs/severity-taxonomy" className="text-primary hover:underline">6-Tier Finding Taxonomy guide</a>:
        </p>

        {/* Severity Visualizer Component */}
        <SeverityTaxonomyVisualizer />
      </section>

      {/* Section 7: Workspace Parity */}
      <section className="space-y-4">
        <HeadingAnchor id="workspace-parity" level={2}>
          7. Guest Workspace vs. Authenticated Workspace Parity
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          Nebula ensures complete intelligence equality between guest explorations and registered accounts, differentiating exclusively by state persistence. Read the complete <a href="/docs/workspace-parity" className="text-primary hover:underline">Workspace Parity analysis</a>:
        </p>

        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="p-3 font-medium">Capability</th>
                <th className="p-3 font-medium text-center">Guest Workspace</th>
                <th className="p-3 font-medium text-center">Authenticated Workspace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-sans">
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-medium text-foreground">Passive Discovery & Topology</td>
                <td className="p-3 text-center text-emerald-500 font-semibold font-mono">✓ Full</td>
                <td className="p-3 text-center text-emerald-500 font-semibold font-mono">✓ Full</td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-medium text-foreground">6-Tier Severity Findings & Evidence</td>
                <td className="p-3 text-center text-emerald-500 font-semibold font-mono">✓ Full</td>
                <td className="p-3 text-center text-emerald-500 font-semibold font-mono">✓ Full</td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-medium text-foreground">Executive Architecture Narrative</td>
                <td className="p-3 text-center text-emerald-500 font-semibold font-mono">✓ Full</td>
                <td className="p-3 text-center text-emerald-500 font-semibold font-mono">✓ Full</td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-medium text-foreground">Historical Snapshot Diffing & Drift</td>
                <td className="p-3 text-center text-muted-foreground font-mono">✕ Ephemeral only</td>
                <td className="p-3 text-center text-emerald-500 font-semibold font-mono">✓ Multi-year archive</td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-medium text-foreground">Continuous 24/7 Scheduled Monitoring</td>
                <td className="p-3 text-center text-muted-foreground font-mono">✕ Manual trigger</td>
                <td className="p-3 text-center text-emerald-500 font-semibold font-mono">✓ Automated Cron</td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-medium text-foreground">Multi-Domain Portfolios & Team RBAC</td>
                <td className="p-3 text-center text-muted-foreground font-mono">✕ Single session</td>
                <td className="p-3 text-center text-emerald-500 font-semibold font-mono">✓ Multi-tenant matrix</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 8: SEO & Privacy Invariants */}
      <section className="space-y-4">
        <HeadingAnchor id="seo-privacy" level={2}>
          8. Search Engine & Privacy Invariants
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          In strict compliance with contract <code className="text-xs font-mono">GX-R001</code>, search engine indexing is restricted to public informational assets. Ephemeral guest session queries (<code className="text-xs font-mono">/guest?domain=*</code>) and private workspaces are tagged with <code className="text-xs font-mono font-medium">noindex, nofollow</code> to guarantee visitor confidentiality.
        </p>
      </section>

      {/* Section 9: Contract Specifications */}
      <section className="space-y-4">
        <HeadingAnchor id="contracts" level={2}>
          9. Contract Specifications
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          The following canonical product contracts govern all guest and workspace behaviors within Nebula:
        </p>

        <div className="space-y-2 pt-1 max-w-prose">
          <div className="p-3 rounded-md bg-muted/15 border border-border flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-medium text-foreground">GX-001 Product Contract</span>
              <p className="text-xs text-muted-foreground">Governs passive discovery boundaries and guest equality.</p>
            </div>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-border text-muted-foreground uppercase">
              FROZEN
            </span>
          </div>

          <div className="p-3 rounded-md bg-muted/15 border border-border flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-medium text-foreground">GX-002 Information Architecture</span>
              <p className="text-xs text-muted-foreground">Defines multi-stage progression and finding card contracts.</p>
            </div>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-border text-muted-foreground uppercase">
              FROZEN
            </span>
          </div>

          <div className="p-3 rounded-md bg-muted/15 border border-border flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-medium text-foreground">GX-014 Header & Navigation</span>
              <p className="text-xs text-muted-foreground">Establishes top bar hierarchy, breadcrumbs, and return paths.</p>
            </div>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-border text-muted-foreground uppercase">
              FROZEN
            </span>
          </div>
        </div>
      </section>

      {/* Code SDK & API Explorer */}
      <section className="space-y-4">
        <HeadingAnchor id="api-integration" level={2}>
          API Integration & Code SDKs
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          Execute guest understanding programmatically or integrate discovery pipelines directly into CI/CD workflows:
        </p>

        <CodeBlock title="Guest Understanding API" tabs={API_SAMPLE_SNIPPETS} />
      </section>

      {/* FAQ Accordion */}
      <DocsFaq />

      {/* Bottom Editorial Callout */}
      <div className="my-10 p-5 rounded-lg border border-border bg-card/60 space-y-3 max-w-3xl">
        <div className="space-y-1">
          <h3 className="text-sm font-serif font-bold text-foreground">
            Experience Non-Intrusive Understanding Live
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Analyze any public domain immediately without creating an account. Reconstruct your 5-hop ingress flow and inspect your active perimeter posture in seconds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <a
            href="/guest"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium text-primary-foreground bg-primary hover:opacity-90 transition-opacity"
          >
            <span>Launch Guest Workspace</span>
            <ArrowRight className="w-3 h-3" />
          </a>
          <a
            href="/workspace/create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-foreground bg-muted hover:bg-muted/80 border border-border transition-colors"
          >
            <span>Create Workspace</span>
          </a>
        </div>
      </div>
    </article>
  );
};
