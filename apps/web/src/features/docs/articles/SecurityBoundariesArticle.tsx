import React from 'react';
import { HeadingAnchor } from '../components/HeadingAnchor';
import { DocsPlaygroundCard } from '../components/DocsPlaygroundCard';

export const SecurityBoundariesArticle: React.FC = () => {
  return (
    <article className="space-y-12 pb-12">
      <header className="space-y-3.5 border-b border-border pb-8">
        <span className="font-mono text-xs text-muted-foreground/80 tracking-wider uppercase block">
          Security & Boundaries · Isolation Specification
        </span>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-foreground leading-[1.15]">
          SSRF Prevention, RFC-1918 Isolation & Cryptographic Integrity
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl font-sans pt-1">
          The non-negotiable security boundaries protecting internal networks, preventing cloud metadata SSRF, and guaranteeing cryptographic truth.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground/70">
          <span>6 min read</span>
          <span>·</span>
          <span>Updated Sep 2026</span>
          <span>·</span>
          <span>Argonion Engineering</span>
        </div>

        <div className="pt-2 text-xs font-mono text-muted-foreground/60">
          RFC-1918 blocking · Cloud metadata barrier · Pre-dial DNS pinning
        </div>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="ssrf-prevention" level={2}>
          1. SSRF & Network Boundary Protection
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          Nebula enforces strict IP and host validation on all submitted domains prior to socket creation or DNS resolution:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="p-4 rounded-md border border-border bg-card space-y-1.5">
            <h3 className="text-xs font-serif font-bold text-foreground">RFC-1918 Private IP Rejection</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Strictly blocks <code className="text-[11px] font-mono">10.0.0.0/8</code>, <code className="text-[11px] font-mono">172.16.0.0/12</code>, and <code className="text-[11px] font-mono">192.168.0.0/16</code> from being probed or dialed.
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-card space-y-1.5">
            <h3 className="text-xs font-serif font-bold text-foreground">Cloud Metadata Endpoint Isolation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Blocks cloud instance metadata addresses (<code className="text-[11px] font-mono">169.254.169.254</code>) and IPv6 link-local addresses (<code className="text-[11px] font-mono">fe80::/10</code>).
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-card space-y-1.5">
            <h3 className="text-xs font-serif font-bold text-foreground">Loopback & Localhost Guard</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Disallows <code className="text-[11px] font-mono">127.0.0.0/8</code> and <code className="text-[11px] font-mono">::1</code> to prevent local loopback reflection attacks.
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-card space-y-1.5">
            <h3 className="text-xs font-serif font-bold text-foreground">DNS Rebinding Prevention</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Validates resolved IP addresses before and after socket connection to neutralize time-of-check to time-of-use (TOCTOU) rebinding.
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
              Read how safety invariants are preserved throughout all 6 stages of discovery.
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
              Understand how security boundaries apply equally to guests and tenants.
            </span>
          </a>
        </div>
      </section>
    </article>
  );
};
