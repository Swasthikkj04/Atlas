import React, { useState } from 'react';
import { 
  Globe, 
  Lock, 
  Cpu, 
  Database, 
  ShieldAlert, 
  Check, 
  Copy, 
  Code2, 
  Compass
} from 'lucide-react';

interface PipelineStageData {
  stage: string;
  index: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  description: string;
  probes: string[];
  telemetryOutput: Record<string, unknown>;
  invariants: string[];
}

const STAGES: PipelineStageData[] = [
  {
    stage: 'PROBING_DNS_NETWORK',
    index: 1,
    label: 'DNS & Perimeter Routing',
    icon: Globe,
    tagline: 'Authoritative nameservers, Anycast routing, and cryptographic DNSSEC verification.',
    description: 'Probes the target domain via standard RFC-1035 UDP/TCP DNS queries across authoritative root and TLD nameservers to resolve Anycast IP infrastructure, zone delegations, and DNSSEC signatures.',
    probes: [
      'Query authoritative NS records for zone delegation',
      'Resolve A and AAAA apex routing records',
      'Inspect MX, TXT, and CNAME perimeter mappings',
      'Verify CAA (Certification Authority Authorization) policies',
      'Validate DNSSEC cryptographic chain of trust (RRSIG, DNSKEY, DS)',
    ],
    telemetryOutput: {
      domain: 'stripe.com',
      nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      dnssec: { enabled: true, validChain: true, algorithm: 'ECDSAP256SHA256' },
      caa: { issue: ['letsencrypt.org', 'digicert.com'], issuewild: ['digicert.com'] },
      ips: ['104.18.20.19', '104.18.21.19'],
    },
    invariants: [
      'Zero invasive probing: Only public RFC-compliant DNS queries executed.',
      'SSRF Guard: Rejects RFC-1918, 127.0.0.1/8, 169.254.169.254 cloud metadata targets.',
    ],
  },
  {
    stage: 'ANALYZING_TLS_SECURITY',
    index: 2,
    label: 'TLS & Wire Protocols',
    icon: Lock,
    tagline: 'SSL/TLS certificate chain, cipher suite negotiation, ALPN, and transport security headers.',
    description: 'Executes TLS 1.2 and TLS 1.3 ClientHello handshakes against public ingress endpoints to extract certificate authorities, validity windows, supported ALPN protocols (HTTP/2, HTTP/3), and strict transport directives.',
    probes: [
      'Perform TLS 1.3 / TLS 1.2 cryptographic handshake',
      'Extract Subject Alternative Names (SAN) & CA chain hierarchy',
      'Evaluate HSTS (Strict-Transport-Security) preload eligibility',
      'Inspect ALPN wire protocol negotiation (h2, h3, http/1.1)',
      'Analyze Content-Security-Policy (CSP) & transport header policies',
    ],
    telemetryOutput: {
      tlsVersion: 'TLSv1.3',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      certificate: {
        issuer: "DigiCert Global Root G2",
        subject: "*.stripe.com",
        validTo: "2027-04-14T23:59:59Z",
        sanCount: 14
      },
      alpn: ['h2', 'http/1.1'],
      hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
    },
    invariants: [
      'Cryptographic authenticity: Telemetry backed strictly by public X.509 cert chains.',
      'Non-disruptive handshakes: Closes TLS sockets immediately after parameter extraction.',
    ],
  },
  {
    stage: 'BEHAVIORAL_FINGERPRINTING',
    index: 3,
    label: 'Deep Behavioral Fingerprinting',
    icon: Cpu,
    tagline: 'Multi-signal attribution across Edge CDNs, Ingress Proxies, Frameworks, and Cloud origins.',
    description: 'Correlates wire-level headers, server error structures, and network ASN topology across 8 canonical infrastructure classifications using deterministic multi-signal heuristics.',
    probes: [
      'Extract CDN edge markers (CF-Ray, Fastly-Debug, X-Amz-Cf-Id)',
      'Determine ingress proxy gateway tokens (Server, Via, X-Powered-By)',
      'Inspect application runtime hydration markers (Next.js, Remix, React)',
      'Map Autonomous System Numbers (ASN) & BGP routing origin',
      'Correlate multi-layer signals across Edge, Gateway, Framework, and Cloud',
    ],
    telemetryOutput: {
      technologies: [
        { category: 'EDGE_CDN', name: 'Cloudflare', confidence: 0.99 },
        { category: 'GATEWAY', name: 'Nginx Ingress', confidence: 0.94 },
        { category: 'FRAMEWORK', name: 'React / Next.js', confidence: 0.96 },
        { category: 'CLOUD_PLATFORM', name: 'Amazon Web Services', confidence: 0.92 }
      ],
      asn: { asn: 13335, org: 'CLOUDFLARENET' }
    },
    invariants: [
      'Deterministic heuristics: Requires minimum 2 corroborating signals before attribution.',
      'Zero synthetic hallucination: Never invents technology markers absent in wire traces.',
    ],
  },
  {
    stage: 'PERSISTING_SNAPSHOT_DIFF',
    index: 4,
    label: 'Snapshot Persistence & Drift',
    icon: Database,
    tagline: 'SHA-256 fingerprint generation, immutable temporal snapshot capture, and delta comparison.',
    description: 'Serializes the unified telemetry graph into a canonical SHA-256 content hash, producing an immutable architectural snapshot used for temporal drift detection and audit lineage.',
    probes: [
      'Compute SHA-256 signature over normalized infrastructure graph',
      'Generate immutable telemetry snapshot payload',
      'Query historical snapshot index for baseline comparison',
      'Calculate structural topology diffs (added/modified/removed assets)',
    ],
    telemetryOutput: {
      snapshotId: 'snp_01j7x8k2m9p4',
      fingerprint: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      drift: { status: 'NO_DRIFT', driftPercentage: 0 }
    },
    invariants: [
      'Content-addressable integrity: Snapshots are strictly immutable once generated.',
      'Deterministic diffing: Server-authoritative comparison without client guesswork.',
    ],
  },
  {
    stage: 'EVALUATING_FINDINGS_ANOMALIES',
    index: 5,
    label: 'Finding & Severity Evaluation',
    icon: ShieldAlert,
    tagline: 'Evaluates 6-tier severity taxonomy across configuration, security, and architectural gaps.',
    description: 'Executes deterministic rule evaluators against the snapshot telemetry graph to detect exposure risks, misconfigurations, and posture gaps categorized across CRITICAL to POSITIVE tiers.',
    probes: [
      'Evaluate TLS cipher suite strength and protocol deprecation',
      'Check HSTS, CSP, and transport security header coverage',
      'Detect origin IP exposure bypassing edge CDN shielding',
      'Validate DNSSEC cryptographic root validation status',
      'Assign severity tier based on standardized risk rubric',
    ],
    telemetryOutput: {
      findings: [
        {
          id: 'FND-TLS-001',
          severity: 'POSITIVE',
          title: 'TLS 1.3 Negotiated with Strict HSTS Preloading',
          category: 'TRANSPORT_SECURITY'
        },
        {
          id: 'FND-DNS-002',
          severity: 'POSITIVE',
          title: 'DNSSEC Cryptographic Signature Chain Validated',
          category: 'DNS_ARCHITECTURE'
        }
      ]
    },
    invariants: [
      'Rule determinism: Identical telemetry always yields identical severity evaluations.',
      'GX Parity: Guest findings match Workspace evaluation engines 1:1 without variance.',
    ],
  },
  {
    stage: 'SYNTHESIZING_BRIEF',
    index: 6,
    label: 'Architecture Synthesis & DAG Flow',
    icon: Compass,
    tagline: 'Constructs the 5-hop canonical ingress DAG flow and executive narrative summary.',
    description: 'Synthesizes the verified telemetry, technology classifications, and finding evaluations into a comprehensive 5-hop Ingress Topology DAG (Client -> Edge -> Gateway -> App -> Cloud) and executive brief.',
    probes: [
      'Synthesize 5-Hop Ingress Flow DAG nodes and edges',
      'Compute category distribution scores across 8 canonical classifications',
      'Generate deterministic executive architecture narrative',
      'Publish unified understanding report to client streaming transport',
    ],
    telemetryOutput: {
      ingressFlow: [
        { hop: 1, role: 'CLIENT', label: 'Public Client' },
        { hop: 2, role: 'EDGE', label: 'Cloudflare CDN' },
        { hop: 3, role: 'GATEWAY', label: 'Nginx Ingress' },
        { hop: 4, role: 'APP', label: 'React / Next.js' },
        { hop: 5, role: 'CLOUD', label: 'Amazon Web Services' }
      ],
      state: 'COMPLETE'
    },
    invariants: [
      'Zero speculative causality: Only verified network hops are rendered in the DAG flow.',
      'Non-blocking stream: Emits real-time progression events to the client interface.',
    ],
  },
];

export const InteractivePipelineVisualizer: React.FC = () => {
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentStage = STAGES[activeStageIdx] || STAGES[0];
  const Icon = currentStage.icon;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(
      JSON.stringify(currentStage.telemetryOutput, null, 2)
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden my-6">
      {/* Stage Tab Selector Bar */}
      <div className="border-b border-border bg-muted/30 overflow-x-auto">
        <div className="flex min-w-max divide-x divide-border" role="tablist">
          {STAGES.map((s, idx) => {
            const isSelected = activeStageIdx === idx;
            return (
              <button
                key={s.stage}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveStageIdx(idx)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs transition-colors text-left cursor-pointer ${
                  isSelected
                    ? 'bg-card text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <span className="font-mono text-[11px] text-muted-foreground/80">
                  0{s.index}
                </span>
                <span className="truncate max-w-[140px]">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Detail Body */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Title & Tagline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded border border-border bg-muted/40 flex items-center justify-center text-foreground">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-serif font-bold text-foreground">
                  {currentStage.label}
                </h4>
                <code className="font-mono text-[10px] text-muted-foreground/80">
                  [{currentStage.stage}]
                </code>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{currentStage.tagline}</p>
            </div>
          </div>
        </div>

        {/* Description & Execution Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Probes & Invariants */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <h5 className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                Execution Methodology
              </h5>
              <p className="text-xs text-foreground/85 leading-relaxed">
                {currentStage.description}
              </p>
            </div>

            <div>
              <h5 className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                Active Telemetry Probes
              </h5>
              <ul className="space-y-1.5" role="list">
                {currentStage.probes.map((probe, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/85">
                    <span className="font-mono text-muted-foreground/60 text-[11px] shrink-0 mt-0.5">
                      →
                    </span>
                    <span>{probe}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-md bg-muted/20 border border-border/70 space-y-1">
              <h5 className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Safety & Integrity Invariants
              </h5>
              <ul className="space-y-0.5" role="list">
                {currentStage.invariants.map((inv, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <span>•</span>
                    <span>{inv}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Real-World Telemetry Payload */}
          <div className="lg:col-span-5">
            <div className="rounded-md border border-border bg-background overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Telemetry Payload Schema
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 text-[11px] font-mono text-foreground/85 overflow-x-auto max-h-72 leading-relaxed bg-background/50">
                <code>{JSON.stringify(currentStage.telemetryOutput, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
