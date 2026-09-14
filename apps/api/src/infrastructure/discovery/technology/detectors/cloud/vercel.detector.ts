import { Injectable } from '@nestjs/common';
import { BaseTechnologyDetector } from '../../base/base-technology.detector';
import {
  TechnologyCategory,
  TechnologyDetectionContext,
  TechnologyDetectionResult,
  TechnologyEvidence,
  TechnologySignal,
} from '../../contracts';

@Injectable()
export class VercelDetector extends BaseTechnologyDetector {
  readonly id = 'tech-vercel';
  readonly name = 'Vercel';
  readonly category = TechnologyCategory.CLOUD_INFRASTRUCTURE;
  readonly description =
    'Vercel frontend cloud, edge serverless runtime, and Next.js hosting substrate';
  readonly role = 'Edge Platform / Frontend Serverless Ingress';
  readonly infrastructureMeaning =
    'The public endpoint appears to use Vercel for edge routing, asset delivery, and frontend serverless execution.';
  readonly detectionSignals = [
    'x-vercel-id response header',
    'x-vercel-cache response header',
    'Server: vercel response header',
    'x-vercel-ip-country or x-vercel-edge-region headers',
    'vercel-dns.com CNAME or NS records',
    '76.76.21.21 Anycast IP record',
    'vercel.app in TLS certificate SAN',
  ];
  readonly confidenceRules =
    'HIGH confidence when x-vercel-id, x-vercel-cache, Server: vercel, vercel-dns.com, or Vercel Anycast IP is observed.';
  readonly whatThisDoesNotProve =
    'Vercel edge platform evidence confirms edge delivery and serverless routing, but does not prove Next.js application framework, React frontend library, Node.js runtime, Vercel Serverless Functions, Edge Functions, origin hosting (AWS, Azure, GCP), Docker containerization, Kubernetes orchestration, or database technologies (PostgreSQL, Supabase, Neon) without direct independent evidence.';
  readonly defaultImplications = [
    'Public frontend and edge functions execute on Vercel Anycast edge network.',
    'Automated TLS, routing, and asset caching are handled by Vercel infrastructure.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const hasVercelId = context.hasHeader('x-vercel-id');
    const hasVercelCache = context.hasHeader('x-vercel-cache');
    const hasVercelCname = context.hasCname(/vercel-dns\.com|vercel\.app/i);
    const hasVercelIp = context.hasARecord('76.76.21.21');
    const hasVercelSan = context.hasCertSan(/vercel\.app/i);
    const hasVercelNs =
      context.dns?.ns?.some((n) => /vercel-dns\.com/i.test(n)) ?? false;

    if (hasVercelId) {
      const vercelId = context.getHeader('x-vercel-id');
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-vercel-id',
        indicator: 'Vercel deployment execution header',
        observedValue: vercelId,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Vercel ID Header',
        type: 'HEADER',
        indicator: `x-vercel-id: ${vercelId}`,
        matched: true,
        weight: 10,
      });
    }

    if (hasVercelCache) {
      const vercelCache = context.getHeader('x-vercel-cache');
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-vercel-cache',
        indicator: 'Vercel edge cache status header',
        observedValue: vercelCache,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Vercel Cache Header',
        type: 'HEADER',
        indicator: `x-vercel-cache: ${vercelCache}`,
        matched: true,
        weight: 9,
      });
    }

    if (server === 'vercel' || server.includes('vercel')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: 'Server: vercel',
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Vercel Server Header',
        type: 'HEADER',
        indicator: 'server: vercel',
        matched: true,
        weight: 9,
      });
    }

    // Additional Vercel edge telemetry headers
    const edgeHeaders = [
      'x-vercel-ip-country',
      'x-vercel-edge-region',
      'x-vercel-deployment-url',
      'x-vercel-sc-headers',
    ];
    for (const h of edgeHeaders) {
      if (context.hasHeader(h)) {
        const val = context.getHeader(h);
        evidence.push({
          sourceType: 'HTTP',
          source: `Response Header: ${h}`,
          indicator: `Vercel edge telemetry (${h})`,
          observedValue: val,
          confidence: 'HIGH',
        });
        signals.push({
          name: `Vercel ${h}`,
          type: 'HEADER',
          indicator: `${h}: ${val}`,
          matched: true,
          weight: 7,
        });
      }
    }

    if (hasVercelCname) {
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'Vercel DNS routing target',
        observedValue: context.dns?.cname
          ?.filter((c) => /vercel-dns\.com|vercel\.app/i.test(c))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Vercel CNAME',
        type: 'DNS',
        indicator: 'vercel-dns.com CNAME',
        matched: true,
        weight: 9,
      });
    }

    if (hasVercelNs) {
      evidence.push({
        sourceType: 'DNS',
        source: 'NS Records',
        indicator: 'Vercel Authoritative Nameservers',
        observedValue: context.dns?.ns
          ?.filter((n) => /vercel-dns\.com/i.test(n))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Vercel NS',
        type: 'DNS',
        indicator: 'vercel-dns.com NS',
        matched: true,
        weight: 9,
      });
    }

    if (hasVercelIp) {
      evidence.push({
        sourceType: 'DNS',
        source: 'A Records',
        indicator: 'Vercel Anycast IP address (76.76.21.21)',
        observedValue: '76.76.21.21',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Vercel Anycast IP',
        type: 'DNS',
        indicator: '76.76.21.21',
        matched: true,
        weight: 8,
      });
    }

    if (hasVercelSan) {
      evidence.push({
        sourceType: 'TLS',
        source: 'Certificate SAN',
        indicator: 'Vercel wildcard domain in certificate SAN',
        observedValue: context.ssl?.certificate?.subjectAltName,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Vercel TLS SAN',
        type: 'CERTIFICATE',
        indicator: 'vercel.app SAN',
        matched: true,
        weight: 8,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    const whyDetected = `Observed Vercel edge infrastructure telemetry (${evidence
      .slice(0, 3)
      .map((e) => e.source)
      .join(', ')})`;

    return this.createResult({
      confidence: 0.99,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      version: undefined,
      role: this.role,
      whyDetected,
      whatThisDoesNotProve: this.whatThisDoesNotProve,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
