import React from 'react';
import { HeadingAnchor } from '../components/HeadingAnchor';
import { SeverityTaxonomyVisualizer } from '../components/SeverityTaxonomyVisualizer';
import { DocsPlaygroundCard } from '../components/DocsPlaygroundCard';

export const SeverityTaxonomyArticle: React.FC = () => {
  return (
    <article className="space-y-12 pb-12">
      <header className="space-y-3.5 border-b border-border pb-8">
        <span className="font-mono text-xs text-muted-foreground/80 tracking-wider uppercase block">
          Foundations · Finding Taxonomy
        </span>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-foreground leading-[1.15]">
          6-Tier Finding & Severity Taxonomy
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl font-sans pt-1">
          The canonical classification system determining finding risk levels, impact scope, and remediation priorities across public perimeter assets.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground/70">
          <span>5 min read</span>
          <span>·</span>
          <span>Updated Sep 2026</span>
          <span>·</span>
          <span>Argonion Engineering</span>
        </div>

        <div className="pt-2 text-xs font-mono text-muted-foreground/60">
          Remediation SLOs · Impact scoping · Deterministic rule evaluation
        </div>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="taxonomy-overview" level={2}>
          1. Deterministic Severity Classification
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          Nebula evaluates observed security posture anomalies under a frozen 6-tier classification taxonomy. Every severity level dictates a specific remediation timeframe and risk impact:
        </p>

        <SeverityTaxonomyVisualizer />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="tier-breakdown" level={2}>
          2. Remediation SLOs & Tiers
        </HeadingAnchor>

        <div className="space-y-3 max-w-3xl">
          <div className="p-4 rounded-md border border-border bg-card space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-serif font-bold text-foreground">CRITICAL Tier</h3>
              <span className="font-mono text-[10px] text-muted-foreground">&lt; 24h SLO</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Immediate threat of breach, perimeter origin IP disclosure bypassing DDoS mitigation, or exposed administrative dashboards.
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-card space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-serif font-bold text-foreground">HIGH Tier</h3>
              <span className="font-mono text-[10px] text-muted-foreground">&lt; 7d SLO</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Deprecated cryptographic protocols (TLS 1.0/1.1), expired or self-signed certificates, or critical DNSSEC signature breaks.
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-card space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-serif font-bold text-foreground">MEDIUM Tier</h3>
              <span className="font-mono text-[10px] text-muted-foreground">&lt; 30d SLO</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Missing strict transport directives (HSTS max-age &lt; 1 year), permissive Content Security Policies, or missing CAA records.
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-card space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-serif font-bold text-foreground">LOW Tier</h3>
              <span className="font-mono text-[10px] text-muted-foreground">&lt; 90d SLO</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Minor informational disclosure including detailed server version headers or cookie directives without Secure/HttpOnly flags.
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-card space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-serif font-bold text-foreground">INFORMATIONAL Tier</h3>
              <span className="font-mono text-[10px] text-muted-foreground">Advisory</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Neutral topology observations such as Anycast BGP routing shifts, CDN changes, or framework hydration markers.
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-card space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-serif font-bold text-foreground">POSITIVE Tier</h3>
              <span className="font-mono text-[10px] text-muted-foreground">Compliance</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Validated modern security posture compliance including TLS 1.3 enforcement, valid DNSSEC chains, and HSTS preloading.
            </p>
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
            href="/docs/understanding-methodology"
            className="p-3.5 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="font-serif font-semibold text-foreground block mb-1">
              Infrastructure Understanding Methodology
            </span>
            <span className="text-muted-foreground text-[11px] leading-relaxed block">
              Discover how findings are extracted during Stage 5 of the pipeline.
            </span>
          </a>
          <a
            href="/docs/workspace-parity"
            className="p-3.5 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="font-serif font-semibold text-foreground block mb-1">
              Guest vs. Workspace Parity
            </span>
            <span className="text-muted-foreground text-[11px] leading-relaxed block">
              Confirm finding evaluation consistency between guest sessions and workspaces.
            </span>
          </a>
        </div>
      </section>
    </article>
  );
};
