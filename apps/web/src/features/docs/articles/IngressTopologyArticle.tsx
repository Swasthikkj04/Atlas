import React from 'react';
import { HeadingAnchor } from '../components/HeadingAnchor';
import { IngressTopologyVisualizer } from '../components/IngressTopologyVisualizer';
import { DocsPlaygroundCard } from '../components/DocsPlaygroundCard';

export const IngressTopologyArticle: React.FC = () => {
  return (
    <article className="space-y-12 pb-12">
      <header className="space-y-3.5 border-b border-border pb-8">
        <span className="font-mono text-xs text-muted-foreground/80 tracking-wider uppercase block">
          Foundations · Ingress Flow
        </span>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-foreground leading-[1.15]">
          5-Hop Canonical Ingress Flow Architecture
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl font-sans pt-1">
          How Nebula reconstructs multi-tier perimeter ingress hierarchies spanning Public Clients, Anycast Edge CDNs, Ingress Reverse Proxies, Application Runtimes, and Cloud Origins.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground/70">
          <span>5 min read</span>
          <span>·</span>
          <span>Updated Sep 2026</span>
          <span>·</span>
          <span>Argonion Engineering</span>
        </div>

        <div className="pt-2 text-xs font-mono text-muted-foreground/60">
          Layer 7 routing · Anycast CDN attribution · Cryptographic TLS termination
        </div>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="ingress-overview" level={2}>
          1. The Ingress Hierarchy Challenge
        </HeadingAnchor>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          Modern cloud architectures rarely expose application runtimes directly to the Internet. Instead, an inbound packet traverses Anycast CDN points of presence (PoPs), Web Application Firewalls (WAF), reverse proxy ingress gateways (e.g., Envoy, Nginx), application microservices, and VPC cloud origins.
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
          Nebula models this multi-hop ingress hierarchy as a deterministic 5-hop canonical Directed Acyclic Graph (DAG):
        </p>

        <IngressTopologyVisualizer />
      </section>

      <DocsPlaygroundCard />

      <section className="space-y-4">
        <HeadingAnchor id="hop-breakdown" level={2}>
          2. Detailed Hop Classifications
        </HeadingAnchor>

        <div className="space-y-3 max-w-3xl">
          <div className="p-4 rounded-md border border-border bg-card space-y-1">
            <h3 className="text-xs font-serif font-bold text-foreground">
              Hop 1: Public Client
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The external consumer issuing standard TLS/TCP handshakes and HTTP queries.
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-card space-y-1">
            <h3 className="text-xs font-serif font-bold text-foreground">
              Hop 2: Edge & CDN Routing
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Global Anycast distribution, edge caching, and DDoS mitigation (Cloudflare, Fastly, AWS CloudFront, Akamai).
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-card space-y-1">
            <h3 className="text-xs font-serif font-bold text-foreground">
              Hop 3: Ingress Gateways & Reverse Proxies
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Layer 7 routing, SSL termination, and rate limiting (Nginx, Envoy, Traefik, HAProxy, AWS ALB).
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-card space-y-1">
            <h3 className="text-xs font-serif font-bold text-foreground">
              Hop 4: Application Runtimes & Frameworks
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Frontend/backend server runtimes (Next.js, React, Node.js, Django, Go, Java Spring Boot).
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-card space-y-1">
            <h3 className="text-xs font-serif font-bold text-foreground">
              Hop 5: Cloud Compute & Infrastructure Origin
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Underlying compute hosts, Kubernetes clusters, and cloud platform zones (AWS, GCP, Azure, DigitalOcean).
            </p>
          </div>
        </div>
      </section>

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
              Learn how the 6-stage pipeline extracts and correlates wire signatures.
            </span>
          </a>
          <a
            href="/docs/behavioral-fingerprinting"
            className="p-3.5 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="font-serif font-semibold text-foreground block mb-1">
              8 Infrastructure Categories & Heuristics
            </span>
            <span className="text-muted-foreground text-[11px] leading-relaxed block">
              Examine multi-signal heuristics across edge, gateway, and runtime layers.
            </span>
          </a>
        </div>
      </section>
    </article>
  );
};
