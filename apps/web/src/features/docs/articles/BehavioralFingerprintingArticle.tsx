import React from 'react';
import { HeadingAnchor } from '../components/HeadingAnchor';
import { DocsPlaygroundCard } from '../components/DocsPlaygroundCard';

export const BehavioralFingerprintingArticle: React.FC = () => {
  return (
    <article className="space-y-12 pb-12">
      <header className="space-y-3.5 border-b border-border pb-8">
        <span className="font-mono text-xs text-muted-foreground/80 tracking-wider uppercase block">
          Foundations · Attribution Engine
        </span>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-foreground leading-[1.15]">
          8 Infrastructure Categories & Multi-Signal Heuristics
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl font-sans pt-1">
          How Nebula correlates wire signals across DNS, TLS, HTTP transit headers, and ASN metadata into deterministic infrastructure attributions.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground/70">
          <span>6 min read</span>
          <span>·</span>
          <span>Updated Sep 2026</span>
          <span>·</span>
          <span>Argonion Engineering</span>
        </div>

        <div className="pt-2 text-xs font-mono text-muted-foreground/60">
          Cross-layer verification · ASN routing attribution · Zero heuristic guessing
        </div>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="multi-signal-heuristics" level={2}>
          1. Multi-Signal Attribution Methodology
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          Rather than relying on fragile single-string header checks that can be easily spoofed or obfuscated, Nebula requires cross-layer corroboration across at least 2 distinct network layers:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 rounded-md bg-muted/20 border border-border space-y-1">
            <span className="font-mono text-[11px] text-foreground font-semibold uppercase">1. Edge & CDN Routing</span>
            <p className="text-muted-foreground leading-relaxed">Anycast BGP routes + nameserver authoritative records + edge response headers.</p>
          </div>
          <div className="p-3 rounded-md bg-muted/20 border border-border space-y-1">
            <span className="font-mono text-[11px] text-foreground font-semibold uppercase">2. Ingress Gateways</span>
            <p className="text-muted-foreground leading-relaxed">Server tokens, HTTP/2 SETTINGS frames, error page structure, and ALPN negotiations.</p>
          </div>
          <div className="p-3 rounded-md bg-muted/20 border border-border space-y-1">
            <span className="font-mono text-[11px] text-foreground font-semibold uppercase">3. Application Frameworks</span>
            <p className="text-muted-foreground leading-relaxed">Hydration markup hints, static chunk paths, script tag hashes, and cookie directives.</p>
          </div>
          <div className="p-3 rounded-md bg-muted/20 border border-border space-y-1">
            <span className="font-mono text-[11px] text-foreground font-semibold uppercase">4. Cloud Platforms</span>
            <p className="text-muted-foreground leading-relaxed">BGP Autonomous System Numbers (ASN), CNAME canonical alias targets, and IP ranges.</p>
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

      <DocsPlaygroundCard />

      {/* Semantic Related Documentation Network (SEO-003) */}
      <section className="space-y-3 pt-6 border-t border-border">
        <h3 className="text-xs font-mono font-medium tracking-wider uppercase text-muted-foreground">
          Related Documentation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <a
            href="/docs/ingress-topology"
            className="p-3.5 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="font-serif font-semibold text-foreground block mb-1">
              5-Hop Canonical Ingress Flow Architecture
            </span>
            <span className="text-muted-foreground text-[11px] leading-relaxed block">
              Explore how edge and gateway classifications map directly into the DAG topology.
            </span>
          </a>
          <a
            href="/docs/severity-taxonomy"
            className="p-3.5 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="font-serif font-semibold text-foreground block mb-1">
              6-Tier Finding & Severity Taxonomy
            </span>
            <span className="text-muted-foreground text-[11px] leading-relaxed block">
              Understand how detected infrastructure attributes drive risk findings.
            </span>
          </a>
        </div>
      </section>
    </article>
  );
};
