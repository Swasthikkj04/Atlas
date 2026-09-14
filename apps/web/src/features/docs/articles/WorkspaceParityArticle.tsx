import React from 'react';
import { HeadingAnchor } from '../components/HeadingAnchor';
import { DocsPlaygroundCard } from '../components/DocsPlaygroundCard';

export const WorkspaceParityArticle: React.FC = () => {
  return (
    <article className="space-y-12 pb-12">
      <header className="space-y-3.5 border-b border-border pb-8">
        <span className="font-mono text-xs text-muted-foreground/80 tracking-wider uppercase block">
          Foundations · System Parity
        </span>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-foreground leading-[1.15]">
          Guest Experience vs. Authenticated Workspace Parity
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl font-sans pt-1">
          The architectural contract ensuring identical intelligence depth between guest visits and registered enterprise workspaces.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground/70">
          <span>4 min read</span>
          <span>·</span>
          <span>Updated Sep 2026</span>
          <span>·</span>
          <span>Argonion Engineering</span>
        </div>

        <div className="pt-2 text-xs font-mono text-muted-foreground/60">
          Intelligence equality · Ephemeral session isolation · Multi-tenant persistence
        </div>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="parity-overview" level={2}>
          1. Intelligence Equality Principle
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          Under contract <code className="text-xs font-mono">GX-R001</code>, Nebula guarantees that the Guest Experience uses the exact same backend engine, topology synthesizers, and finding rule sets as registered accounts. The only distinction is state persistence.
        </p>

        <div className="overflow-x-auto rounded-md border border-border my-4">
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
              Read how the underlying pipeline executes non-intrusive discovery.
            </span>
          </a>
          <a
            href="/docs/security-boundaries"
            className="p-3.5 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="font-serif font-semibold text-foreground block mb-1">
              SSRF & Security Boundaries
            </span>
            <span className="text-muted-foreground text-[11px] leading-relaxed block">
              Review RFC-1918 isolation and cryptographic guarantees protecting guest probes.
            </span>
          </a>
        </div>
      </section>
    </article>
  );
};
