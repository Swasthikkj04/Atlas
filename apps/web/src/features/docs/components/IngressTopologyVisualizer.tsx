import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface IngressHopNode {
  hop: number;
  role: string;
  name: string;
  category: string;
  vendor: string;
  signals: string[];
  description: string;
}

const TOPOLOGY_HOPS: IngressHopNode[] = [
  {
    hop: 1,
    role: 'CLIENT',
    name: 'Public Client',
    category: 'Ingress Source',
    vendor: 'Internet Consumer',
    signals: ['RFC-1035 UDP DNS', 'TLS 1.3 ClientHello', 'HTTP/2 ALPN'],
    description: 'External user or API consumer initiating public TLS/TCP network transactions.',
  },
  {
    hop: 2,
    role: 'EDGE',
    name: 'Anycast CDN & WAF',
    category: 'Edge Routing',
    vendor: 'Cloudflare / Fastly / Akamai',
    signals: ['CF-Ray Header', 'BGP Anycast AS13335', 'Authoritative NS'],
    description: 'Global edge Anycast routing, DDoS mitigation, and edge TLS termination point.',
  },
  {
    hop: 3,
    role: 'GATEWAY',
    name: 'Reverse Proxy & Ingress',
    category: 'Ingress Controller',
    vendor: 'Nginx / Envoy / HAProxy',
    signals: ['Server Token', 'HTTP/2 SETTINGS Frame', 'ALPN Negotiation'],
    description: 'Perimeter ingress gateway orchestrating Layer 7 routing and load balancing.',
  },
  {
    hop: 4,
    role: 'APP',
    name: 'Application Runtime',
    category: 'Framework Tier',
    vendor: 'Next.js / Node.js / React',
    signals: ['Hydration Markers', 'Chunk Script Hash', 'Runtime Directives'],
    description: 'Application server runtime executing business logic and rendering state.',
  },
  {
    hop: 5,
    role: 'CLOUD',
    name: 'Cloud Infrastructure',
    category: 'Origin Compute',
    vendor: 'AWS / GCP / Azure',
    signals: ['BGP Origin ASN', 'Canonical CNAME Alias', 'Compute IP Range'],
    description: 'Underlying cloud platform hosting VPC compute nodes, databases, and microservices.',
  },
];

export const IngressTopologyVisualizer: React.FC = () => {
  const [selectedHopIdx, setSelectedHopIdx] = useState(1);
  const currentHop = TOPOLOGY_HOPS[selectedHopIdx] || TOPOLOGY_HOPS[1];

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden my-6">
      {/* 5-Hop Flow Header Diagram */}
      <div className="p-4 sm:p-5 bg-muted/20 border-b border-border">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 sm:pb-0">
          {TOPOLOGY_HOPS.map((node, idx) => {
            const isSelected = selectedHopIdx === idx;
            return (
              <React.Fragment key={node.role}>
                <button
                  type="button"
                  onClick={() => setSelectedHopIdx(idx)}
                  className={`flex flex-col items-center p-2.5 rounded-md transition-colors text-center cursor-pointer min-w-[100px] sm:min-w-[120px] ${
                    isSelected
                      ? 'bg-card border border-border text-foreground font-medium shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    Hop 0{node.hop}
                  </span>
                  <span className="text-xs font-semibold mt-0.5">{node.role}</span>
                  <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {node.name.split(' ')[0]}
                  </span>
                </button>

                {idx < TOPOLOGY_HOPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 hidden sm:block" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Hop Detail Panel */}
      <div className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
              Hop 0{currentHop.hop} • {currentHop.category}
            </span>
            <h4 className="text-base font-serif font-bold text-foreground mt-0.5">
              {currentHop.name}
            </h4>
          </div>

          <span className="font-mono text-xs text-muted-foreground px-2 py-0.5 rounded border border-border bg-muted/30 self-start sm:self-auto">
            {currentHop.vendor}
          </span>
        </div>

        <p className="text-xs text-foreground/85 leading-relaxed">
          {currentHop.description}
        </p>

        <div>
          <h5 className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-2">
            Wire Telemetry Attribution Signals
          </h5>
          <div className="flex flex-wrap gap-2">
            {currentHop.signals.map((sig, i) => (
              <span
                key={i}
                className="font-mono text-[11px] px-2 py-1 rounded bg-muted/40 border border-border text-foreground/80"
              >
                {sig}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
