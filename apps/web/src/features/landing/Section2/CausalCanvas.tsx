import React, { useState } from 'react';
import {
  Shield,
  Server,
  Database,
  Activity,
  CheckCircle2,
  Lock,
  Cpu,
  GitCommit,
  Layers,
  Terminal,
} from 'lucide-react';

type ModeType = 'topology' | 'security' | 'forensics';

interface TopologyNode {
  id: string;
  name: string;
  role: string;
  category: string;
  latency: string;
  status: string;
  statusColor: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  details: string[];
  metrics: { label: string; val: string }[];
}

const TOPOLOGY_NODES: TopologyNode[] = [
  {
    id: 'edge',
    name: 'Edge Ingress',
    role: 'Cloudflare Anycast • WAF',
    category: 'Perimeter Layer',
    latency: '4ms',
    status: 'ACTIVE',
    statusColor: '#10b981',
    icon: Shield,
    details: [
      'TLS 1.3 negotiated with ChaCha20-Poly1305 (0-RTT enabled)',
      'HTTP/3 over QUIC active across 320+ global Anycast edge PoPs',
      'L7 DDoS mitigation & automated bot challenge active (0 false positives)',
      'Direct origin IP strictly cloaked behind Anycast perimeter',
    ],
    metrics: [
      { label: 'Throughput', val: '42.8k req/s' },
      { label: 'P99 Latency', val: '4.2 ms' },
      { label: 'Cache Ratio', val: '94.6%' },
    ],
  },
  {
    id: 'gateway',
    name: 'API Gateway',
    role: 'Envoy Proxy • Rate Limiter',
    category: 'Routing Layer',
    latency: '8ms',
    status: 'HEALTHY',
    statusColor: '#10b981',
    icon: Server,
    details: [
      'Mutual TLS (mTLS) with SPIFFE/SPIRE x509 service identities',
      'JWT token cryptographic signature verification in < 0.4ms',
      'Distributed token-bucket rate limiter (5,000 req/min/tenant)',
      'Real-time gRPC stream multiplexing to backend worker pools',
    ],
    metrics: [
      { label: 'P99 Latency', val: '8.1 ms' },
      { label: 'Auth Success', val: '99.99%' },
      { label: 'Active Conns', val: '14.2k' },
    ],
  },
  {
    id: 'mesh',
    name: 'Service Mesh',
    role: 'Core API Cluster • K8s Pods',
    category: 'Compute Core',
    latency: '14ms',
    status: 'NOMINAL',
    statusColor: '#10b981',
    icon: Cpu,
    details: [
      '120 horizontal pod autoscalers (HPA) across 3 availability zones',
      'Zero-downtime rolling canary deployments with automated circuit breaking',
      'Distributed OpenTelemetry trace context propagation across all RPC hops',
      'Memory heap allocation at 34% steady-state (0 leak trajectory)',
    ],
    metrics: [
      { label: 'Mesh P99', val: '14.2 ms' },
      { label: 'Availability', val: '99.99%' },
      { label: 'Pod Health', val: '120 / 120' },
    ],
  },
  {
    id: 'state',
    name: 'State & Cache',
    role: 'Postgres Cluster • Redis Store',
    category: 'Persistence Layer',
    latency: '2ms',
    status: 'SYNCED',
    statusColor: '#10b981',
    icon: Database,
    details: [
      'Read-replica streaming replication lag < 12ms across multi-region nodes',
      'Redis cluster sub-millisecond cache hit response (0.8ms P99 latency)',
      'Continuous WAL archiving with verified point-in-time recovery (PITR)',
      'Connection pool strictly bounded at 450 connections (0 queued requests)',
    ],
    metrics: [
      { label: 'Cache Hit', val: '98.4%' },
      { label: 'Replica Lag', val: '11 ms' },
      { label: 'Pool Load', val: '28%' },
    ],
  },
];

const SECURITY_CHECKS = [
  {
    title: 'TLS 1.3 & Cryptographic Hygiene',
    detail: 'ChaCha20-Poly1305 / AES-256-GCM with perfect forward secrecy. X.509 cert valid (78d remaining).',
    status: 'VERIFIED',
    grade: 'A+',
  },
  {
    title: 'DNSSEC Root Integrity',
    detail: 'Signed with RRSIG and DS records in the root trust chain. Zero dangling CNAME records.',
    status: 'SIGNED',
    grade: 'PASS',
  },
  {
    title: 'HSTS & Security Headers',
    detail: 'Strict-Transport-Security (max-age=63072000; includeSubDomains; preload). X-Frame-Options: DENY.',
    status: 'ENFORCED',
    grade: 'MAX',
  },
  {
    title: 'Zero-Trust Perimeter Exposure',
    detail: 'Internal ports (22, 5432, 6379, 8080) completely hidden behind VPC mesh. Direct origin cloaked.',
    status: 'SECURE',
    grade: '100%',
  },
];

const FORENSICS_EVENTS = [
  {
    id: 'evt-1',
    time: '12m ago',
    badge: 'CANARY DEPLOY',
    title: 'Production Canary Deployment #c4f910',
    description: 'Canary traffic promoted to 100%. P99 latency reduced by -2.4ms across edge gateways.',
    verdict: 'ZERO DRIFT',
    color: '#10b981',
  },
  {
    id: 'evt-2',
    time: '45m ago',
    badge: 'SURGE ABSORPTION',
    title: 'EU-West Ingress Traffic Surge (+38%)',
    description: 'Redis cluster cache absorbed 98.4% of incoming read queries without database pool saturation.',
    verdict: 'NOMINAL',
    color: '#38bdf8',
  },
  {
    id: 'evt-3',
    time: '2h ago',
    badge: 'KEY ROTATION',
    title: 'Perimeter TLS Session Ticket Key Rotation',
    description: 'Automated cryptographic key rotation completed across 320 global Anycast PoPs with 0 drops.',
    verdict: 'COMPLETED',
    color: '#10b981',
  },
];

export const CausalCanvas: React.FC = () => {
  const [activeMode, setActiveMode] = useState<ModeType>('topology');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('edge');

  const selectedNode = TOPOLOGY_NODES.find((n) => n.id === selectedNodeId) || TOPOLOGY_NODES[0];

  return (
    <section
      id="nebula"
      style={{
        backgroundColor: '#07080b',
        color: '#f8fafc',
        padding: '7rem 2rem',
        borderTop: '1px solid #1a1e29',
        borderBottom: '1px solid #1a1e29',
        fontFamily: 'Inter, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Glow Backdrop */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: '4.5rem',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Left Column: Core Value & Architectural Narrative */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              marginBottom: '1.5rem',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 8px #38bdf8',
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#38bdf8',
                fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
              }}
            >
              Architectural Intelligence
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
              fontWeight: 850,
              letterSpacing: '-0.035em',
              lineHeight: 1.1,
              marginTop: 0,
              marginBottom: '1.5rem',
              color: '#ffffff',
            }}
          >
            Deep topological clarity.{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Zero synthetic guesswork.
            </span>
          </h2>

          <p
            style={{
              fontSize: '1.0625rem',
              lineHeight: 1.65,
              color: '#94a3b8',
              marginBottom: '2rem',
              maxWidth: '520px',
            }}
          >
            Nebula analyzes live DNS records, TLS cryptographic chains, edge routing hops, and runtime microservice telemetry to construct an authoritative, auditable causal graph of your systems.
          </p>

          {/* Value Propositions */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '2.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Layers style={{ width: '13px', height: '13px', color: '#38bdf8' }} />
              </div>
              <div>
                <strong style={{ color: '#f1f5f9', fontSize: '0.9375rem', display: 'block', fontWeight: 600 }}>
                  Multi-Tier Perimeter Topology
                </strong>
                <span style={{ color: '#64748b', fontSize: '0.84rem', lineHeight: 1.4, display: 'block', marginTop: '2px' }}>
                  Reconstructs the full request lifecycle from edge DNS & CDN down to internal database pools.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Lock style={{ width: '13px', height: '13px', color: '#10b981' }} />
              </div>
              <div>
                <strong style={{ color: '#f1f5f9', fontSize: '0.9375rem', display: 'block', fontWeight: 600 }}>
                  Cryptographic Protocol Verification
                </strong>
                <span style={{ color: '#64748b', fontSize: '0.84rem', lineHeight: 1.4, display: 'block', marginTop: '2px' }}>
                  Validates TLS ciphers, DNSSEC root trusts, HSTS preloads, and zero-trust perimeter boundaries.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(129, 140, 248, 0.1)',
                  border: '1px solid rgba(129, 140, 248, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <GitCommit style={{ width: '13px', height: '13px', color: '#818cf8' }} />
              </div>
              <div>
                <strong style={{ color: '#f1f5f9', fontSize: '0.9375rem', display: 'block', fontWeight: 600 }}>
                  Continuous State Forensics
                </strong>
                <span style={{ color: '#64748b', fontSize: '0.84rem', lineHeight: 1.4, display: 'block', marginTop: '2px' }}>
                  Correlates deployments and runtime drift into transparent, auditable evidence graphs.
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              paddingLeft: '1.25rem',
              borderLeft: '2px solid #273043',
            }}
          >
            <p
              style={{
                fontSize: '0.9375rem',
                color: '#cbd5e1',
                fontStyle: 'italic',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              "We provide the evidence graph and the reasoning framework. You retain the judgment."
            </p>
          </div>
        </div>

        {/* Right Column: Premium Live Infrastructure Intelligence Console */}
        <div
          style={{
            backgroundColor: '#0e1117',
            border: '1px solid #1e2433',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Console Top Window Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.25rem',
              backgroundColor: '#090b0f',
              borderBottom: '1px solid #1a202c',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', opacity: 0.8 }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b', opacity: 0.8 }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', opacity: 0.8 }} />
              </div>
              <div
                style={{
                  height: '14px',
                  width: '1px',
                  backgroundColor: '#1e293b',
                  margin: '0 0.25rem',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 6px #10b981',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    letterSpacing: '0.04em',
                  }}
                >
                  LIVE PERIMETER MODEL // 12ms P99
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  fontWeight: 600,
                }}
              >
                VERIFIED TELEMETRY
              </span>
            </div>
          </div>

          {/* Interactive Mode Switcher Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              borderBottom: '1px solid #1a202c',
              backgroundColor: '#0c0e14',
            }}
          >
            {[
              { id: 'topology', label: 'Topology Graph', icon: Layers },
              { id: 'security', label: 'Protocol Hygiene', icon: Lock },
              { id: 'forensics', label: 'State Forensics', icon: Activity },
            ].map((tab) => {
              const isActive = activeMode === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMode(tab.id as ModeType)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 0.5rem',
                    backgroundColor: isActive ? '#131722' : 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${isActive ? '#38bdf8' : 'transparent'}`,
                    color: isActive ? '#ffffff' : '#64748b',
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon style={{ width: '14px', height: '14px', color: isActive ? '#38bdf8' : '#64748b' }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Interactive Workspace Area */}
          <div style={{ padding: '1.5rem', minHeight: '360px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {activeMode === 'topology' && (
              <>
                {/* 1. Visual Pipeline Hop Flow */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                  {TOPOLOGY_NODES.map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    const Icon = node.icon;
                    return (
                      <div
                        key={node.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedNodeId(node.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedNodeId(node.id);
                          }
                        }}
                        style={{
                          backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.08)' : '#11141d',
                          border: `1px solid ${isSelected ? '#38bdf8' : '#1e2433'}`,
                          borderRadius: '10px',
                          padding: '0.85rem 0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.12)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              backgroundColor: isSelected ? '#38bdf8' : '#1e2433',
                              color: isSelected ? '#0b0c10' : '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Icon style={{ width: '15px', height: '15px' }} />
                          </div>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                              color: '#10b981',
                              fontWeight: 600,
                            }}
                          >
                            {node.latency}
                          </span>
                        </div>

                        <div>
                          <span
                            style={{
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              color: isSelected ? '#ffffff' : '#cbd5e1',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {node.name}
                          </span>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              color: isSelected ? '#93c5fd' : '#64748b',
                              display: 'block',
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {node.role}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Deep Node Inspector Card */}
                <div
                  style={{
                    backgroundColor: '#090b10',
                    border: '1px solid #1a202c',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #161b26', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                          color: '#38bdf8',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                        }}
                      >
                        {selectedNode.category}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#f8fafc' }}>
                        {selectedNode.name} Inspector
                      </h4>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {selectedNode.metrics.map((m, i) => (
                        <div key={i} style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>{m.label}</span>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace', fontWeight: 600, color: '#e2e8f0' }}>{m.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Node Verified Telemetry Points */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {selectedNode.details.map((detail, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.6rem',
                          fontSize: '0.8125rem',
                          color: '#cbd5e1',
                          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                          backgroundColor: '#11141d',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '6px',
                          borderLeft: '2px solid #38bdf8',
                        }}
                      >
                        <CheckCircle2 style={{ width: '13px', height: '13px', color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ lineHeight: 1.4 }}>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeMode === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {SECURITY_CHECKS.map((check, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#090b10',
                      border: '1px solid #1a202c',
                      borderRadius: '8px',
                      padding: '0.9rem 1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ fontSize: '0.875rem', color: '#f1f5f9', display: 'block', fontWeight: 600 }}>
                          {check.title}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '2px', fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace' }}>
                          {check.detail}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#34d399',
                          fontWeight: 700,
                        }}
                      >
                        {check.status} [{check.grade}]
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeMode === 'forensics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {FORENSICS_EVENTS.map((evt) => (
                  <div
                    key={evt.id}
                    style={{
                      backgroundColor: '#090b10',
                      border: '1px solid #1a202c',
                      borderRadius: '8px',
                      padding: '0.9rem 1.1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            color: '#38bdf8',
                            fontWeight: 700,
                          }}
                        >
                          {evt.badge}
                        </span>
                        <strong style={{ fontSize: '0.875rem', color: '#f1f5f9', fontWeight: 600 }}>
                          {evt.title}
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace' }}>
                        {evt.time}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45 }}>
                      {evt.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Console Bottom Bar */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: '#090b0f',
              borderTop: '1px solid #1a202c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: '#64748b',
              fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal style={{ width: '12px', height: '12px', color: '#38bdf8' }} />
              <span>Causal DAG Engine: ACTIVE</span>
            </div>
            <span>Audit Proof: SHA-256 Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
};

CausalCanvas.displayName = 'CausalCanvas';
