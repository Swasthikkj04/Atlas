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
export class FastlyDetector extends BaseTechnologyDetector {
  readonly id = 'tech-fastly';
  readonly name = 'Fastly';
  readonly category = TechnologyCategory.CDN_EDGE;
  readonly description =
    'Fastly edge cloud platform, programmable CDN, VCL edge caching, and real-time reverse proxy';
  readonly role = 'Edge Delivery / CDN Ingress';
  readonly infrastructureMeaning =
    'The public endpoint appears to use Fastly edge points of presence (POPs) to deliver, cache, and accelerate traffic globally.';
  readonly detectionSignals = [
    'x-served-by response header indicating Fastly POP node routing (e.g. cache-iad-*, cache-ord-*)',
    'x-cache response header indicating edge cache state (HIT, MISS)',
    'x-cache-hits response header',
    'x-timer response header (Fastly epoch and delta timer)',
    'fastly-debug / fastly-debug-digest / fastly-debug-path headers',
    'x-fastly-request-id response header',
    'CNAME records pointing to *.fastly.net, *.fastlylb.net, or *.dualstack.fastly.net',
    'Server: Varnish with Fastly POP corroboration',
  ];
  readonly confidenceRules =
    'HIGH confidence when x-served-by, x-fastly-request-id, fastly-debug, x-timer, or Fastly CNAME records are observed.';
  readonly whatThisDoesNotProve =
    'Fastly edge delivery evidence confirms edge proxy and caching participation, but does not prove origin hosting on AWS, Azure, GCP, or a private datacenter, nor does it establish NGINX, Apache, Envoy, Caddy, Kubernetes, Docker, Linux, Node.js, Python, PHP, Ruby, Go, Rust, PostgreSQL, MySQL, Redis, specific VCL configuration, or backend database services without direct independent evidence.';
  readonly defaultImplications = [
    'Inbound HTTP/HTTPS traffic is proxied through Fastly edge points of presence (POPs).',
    'Edge caching, request acceleration, and VCL/Compute@Edge logic execute at the Fastly edge.',
    'Origin IP addresses and internal infrastructure are shielded behind Fastly edge infrastructure.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasFastlyReqId = context.hasHeader('x-fastly-request-id');
    const hasFastlyDebug =
      context.hasHeader('fastly-debug') ||
      context.hasHeader('fastly-debug-digest') ||
      context.hasHeader('fastly-debug-path') ||
      context.hasHeader('fastly-debug-ttl') ||
      context.hasHeader('fastly-restarts');
    const servedBy = context.getHeader('x-served-by') ?? '';
    const cacheHeader = context.getHeader('x-cache') ?? '';
    const cacheHits = context.getHeader('x-cache-hits') ?? '';
    const timerHeader = context.getHeader('x-timer') ?? '';
    const serverHeader = context.getHeader('server')?.toLowerCase() ?? '';
    const hasFastlyCname = context.hasCname(/fastly\.net|fastlylb\.net/i);

    // 1. Fastly Request ID
    if (hasFastlyReqId) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-fastly-request-id',
        indicator: 'Fastly edge request identifier',
        observedValue: context.getHeader('x-fastly-request-id'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Fastly Request ID',
        type: 'HEADER',
        indicator: 'x-fastly-request-id',
        matched: true,
        weight: 10,
      });
    }

    // 2. Fastly Debug Headers
    if (hasFastlyDebug) {
      const debugHeaderNames = [
        'fastly-debug',
        'fastly-debug-digest',
        'fastly-debug-path',
        'fastly-debug-ttl',
        'fastly-restarts',
      ].filter((h) => context.hasHeader(h));

      evidence.push({
        sourceType: 'HTTP',
        source: `Response Headers: ${debugHeaderNames.join(', ')}`,
        indicator: 'Fastly edge debug & diagnostic headers',
        observedValue: debugHeaderNames
          .map((h) => `${h}: ${context.getHeader(h)}`)
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Fastly Debug Header',
        type: 'HEADER',
        indicator: debugHeaderNames.join(', '),
        matched: true,
        weight: 10,
      });
    }

    // 3. X-Served-By: cache-* / fastly
    const isCacheNode =
      /^cache-[a-z0-9-]+/i.test(servedBy.trim()) || /fastly/i.test(servedBy);
    if (isCacheNode) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-served-by',
        indicator: 'Fastly POP cache node in X-Served-By',
        observedValue: servedBy,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Fastly Served By',
        type: 'HEADER',
        indicator: `x-served-by: ${servedBy}`,
        matched: true,
        weight: 9,
      });
    }

    // 4. X-Cache / X-Cache-Hits / X-Timer Telemetry
    if (cacheHeader || cacheHits || timerHeader) {
      // Only treat x-cache / x-timer as Fastly signals if corroborated by cache node, fastly header, or CNAME
      const isCorroboratedFastly =
        isCacheNode ||
        hasFastlyReqId ||
        hasFastlyDebug ||
        hasFastlyCname ||
        /^S\d+,VS\d+,VE\d+/i.test(timerHeader.trim());

      if (isCorroboratedFastly) {
        const cacheSignals: string[] = [];
        if (cacheHeader) cacheSignals.push(`x-cache: ${cacheHeader}`);
        if (cacheHits) cacheSignals.push(`x-cache-hits: ${cacheHits}`);
        if (timerHeader) cacheSignals.push(`x-timer: ${timerHeader}`);

        evidence.push({
          sourceType: 'HTTP',
          source: 'Response Headers: Caching & Timer',
          indicator: 'Fastly edge cache and request timing telemetry',
          observedValue: cacheSignals.join(', '),
          confidence: 'HIGH',
        });
        signals.push({
          name: 'Fastly Cache Telemetry',
          type: 'HEADER',
          indicator: cacheSignals.join(', '),
          matched: true,
          weight: 8,
        });
      }
    }

    // 5. CNAME Records
    if (hasFastlyCname) {
      const cnames =
        context.dns?.cname?.filter((c) =>
          /fastly\.net|fastlylb\.net/i.test(c),
        ) || [];
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'Fastly CNAME routing target',
        observedValue: cnames.join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Fastly CNAME',
        type: 'DNS',
        indicator: 'fastly.net CNAME',
        matched: true,
        weight: 9,
      });
    }

    // 6. Server: Varnish (Fastly is based on customized Varnish, corroborated by cache headers)
    if (
      serverHeader.includes('varnish') &&
      (isCacheNode || hasFastlyCname || hasFastlyReqId)
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: 'Varnish HTTP accelerator banner (Fastly underlying engine)',
        observedValue: context.getHeader('server'),
        confidence: 'MEDIUM',
      });
      signals.push({
        name: 'Varnish Server Header',
        type: 'HEADER',
        indicator: 'Server: Varnish',
        matched: true,
        weight: 6,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.98,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: 'Edge Delivery / CDN Ingress',
      infrastructureMeaning: this.infrastructureMeaning,
      whatThisDoesNotProve: this.whatThisDoesNotProve,
    });
  }
}
