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
export class AkamaiDetector extends BaseTechnologyDetector {
  readonly id = 'tech-akamai';
  readonly name = 'Akamai';
  readonly category = TechnologyCategory.CDN_EDGE;
  readonly description =
    'Akamai Intelligent Edge platform, global content delivery network, and edge security gateway';
  readonly role = 'Edge Delivery / CDN Ingress';
  readonly infrastructureMeaning =
    'The public endpoint appears to use the Akamai Intelligent Edge network to deliver, cache, and secure traffic globally.';
  readonly detectionSignals = [
    'Server header containing akamaighost, akamainetstorage, or ghost',
    'x-akamai-transformed response header',
    'x-akamai-request-id response header',
    'akamai-grn response header (Akamai Global Request Number)',
    'x-akamai-session-info / x-akamai-staging / x-akamai-edgescape response headers',
    'Via header containing akamaighost, akamai, or GHost',
    'CNAME records pointing to edgekey.net, edgesuite.net, akamaiedge.net, akamaihd.net, akamaistream.net, or akamai.net',
    'Nameserver (NS) records pointing to akam.net or akamai.net',
  ];
  readonly confidenceRules =
    'HIGH confidence when Server: AkamaiGHost, x-akamai-* headers, or Akamai edge CNAMEs are observed.';
  readonly whatThisDoesNotProve =
    'Akamai edge delivery evidence confirms edge proxy and security perimeter participation, but does not prove origin hosting on AWS, Azure, GCP, or a private datacenter, nor does it establish NGINX, Apache, Envoy, Caddy, Kubernetes, Docker, Linux, Node.js, Python, PHP, Ruby, Go, Rust, PostgreSQL, MySQL, Redis, specific edge security rules, or backend database services without direct independent evidence.';
  readonly defaultImplications = [
    'Inbound HTTP/HTTPS traffic is proxied through the Akamai Intelligent Edge network.',
    'Edge caching, DDoS mitigation, and WAF inspection execute at the Akamai edge.',
    'Origin server IP addresses and internal infrastructure topology are shielded behind Akamai edge infrastructure.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const via = context.getHeader('via')?.toLowerCase() ?? '';
    const hasAkamaiTransformed = context.hasHeader('x-akamai-transformed');
    const hasAkamaiReqId = context.hasHeader('x-akamai-request-id');
    const hasAkamaiGrn = context.hasHeader('akamai-grn');
    const hasAkamaiSessionInfo = context.hasHeader('x-akamai-session-info');
    const hasAkamaiStaging = context.hasHeader('x-akamai-staging');
    const hasAkamaiEdgescape = context.hasHeader('x-akamai-edgescape');
    const hasAkamaiCname = context.hasCname(
      /edgekey\.net|edgesuite\.net|akamaiedge\.net|akamaihd\.net|akamaistream\.net|akamai\.net|srip\.net/i,
    );
    const hasAkamaiNs = context.hasNs(/akam\.net|akamai/i);

    // 1. Server Header
    if (
      server.includes('akamaighost') ||
      server.includes('akamainetstorage') ||
      server === 'ghost' ||
      server.includes('akamai')
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${context.getHeader('server')}`,
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Akamai Server Banner',
        type: 'HEADER',
        indicator: server,
        matched: true,
        weight: 10,
      });
    }

    // 2. Transformed Header
    if (hasAkamaiTransformed) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-akamai-transformed',
        indicator: 'Akamai edge media / cache transformation header',
        observedValue: context.getHeader('x-akamai-transformed'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Akamai Transformed Header',
        type: 'HEADER',
        indicator: 'x-akamai-transformed',
        matched: true,
        weight: 10,
      });
    }

    // 3. Request ID
    if (hasAkamaiReqId) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-akamai-request-id',
        indicator: 'Akamai edge request trace identifier',
        observedValue: context.getHeader('x-akamai-request-id'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Akamai Request ID',
        type: 'HEADER',
        indicator: 'x-akamai-request-id',
        matched: true,
        weight: 10,
      });
    }

    // 4. Global Request Number (GRN)
    if (hasAkamaiGrn) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: akamai-grn',
        indicator: 'Akamai Global Request Number (GRN) routing header',
        observedValue: context.getHeader('akamai-grn'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Akamai GRN Header',
        type: 'HEADER',
        indicator: 'akamai-grn',
        matched: true,
        weight: 9,
      });
    }

    // 5. Additional Akamai Headers
    if (hasAkamaiSessionInfo || hasAkamaiStaging || hasAkamaiEdgescape) {
      const extraHeaders = [
        'x-akamai-session-info',
        'x-akamai-staging',
        'x-akamai-edgescape',
      ].filter((h) => context.hasHeader(h));
      evidence.push({
        sourceType: 'HTTP',
        source: `Response Headers: ${extraHeaders.join(', ')}`,
        indicator: 'Akamai edge session and routing telemetry',
        observedValue: extraHeaders
          .map((h) => `${h}: ${context.getHeader(h)}`)
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Akamai Edge Headers',
        type: 'HEADER',
        indicator: extraHeaders.join(', '),
        matched: true,
        weight: 9,
      });
    }

    // 6. Via Header
    if (via.includes('akamai') || via.includes('ghost')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: via',
        indicator: 'Akamai proxy signature in Via header',
        observedValue: context.getHeader('via'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Akamai Via Header',
        type: 'HEADER',
        indicator: 'via: akamai',
        matched: true,
        weight: 8,
      });
    }

    // 7. CNAME Records
    if (hasAkamaiCname) {
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'Akamai edge routing CNAME target',
        observedValue: context.dns?.cname
          ?.filter((c) =>
            /edgekey\.net|edgesuite\.net|akamaiedge\.net|akamaihd\.net|akamaistream\.net|akamai\.net|srip\.net/i.test(
              c,
            ),
          )
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Akamai Edge CNAME',
        type: 'DNS',
        indicator: 'akamaiedge.net CNAME',
        matched: true,
        weight: 9,
      });
    }

    // 8. Nameserver Records
    if (hasAkamaiNs) {
      evidence.push({
        sourceType: 'DNS',
        source: 'Nameserver Records (NS)',
        indicator: 'Akamai Edge DNS authoritative nameserver',
        observedValue: context.dns?.ns
          ?.filter((ns) => /akam\.net|akamai/i.test(ns))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Akamai Edge DNS NS',
        type: 'DNS',
        indicator: 'akam.net NS',
        matched: true,
        weight: 8,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.99,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: this.role,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
