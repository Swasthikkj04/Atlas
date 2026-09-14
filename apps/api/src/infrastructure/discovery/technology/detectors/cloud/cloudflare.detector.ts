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
export class CloudflareDetector extends BaseTechnologyDetector {
  readonly id = 'tech-cloudflare';
  readonly name = 'Cloudflare';
  readonly category = TechnologyCategory.CDN_EDGE;
  readonly description =
    "Cloudflare's globally distributed edge, reverse-proxy, CDN and network security platform";
  readonly role = 'Edge / CDN / Reverse Proxy';
  readonly infrastructureMeaning =
    'The public endpoint appears to be fronted by Cloudflare edge and security infrastructure.';
  readonly detectionSignals = [
    'cf-ray response header',
    'cf-cache-status response header',
    'Server: cloudflare response header',
    'cloudflare.com authoritative nameservers',
  ];
  readonly confidenceRules =
    'HIGH confidence when cf-ray or Server: cloudflare header is observed, or Cloudflare authoritative NS is present.';
  readonly whatThisDoesNotProve =
    'Presence of Cloudflare edge proxy does not identify or prove the underlying origin server hosting provider or private internal network architecture.';
  readonly defaultImplications = [
    'Inbound HTTP/HTTPS traffic is proxied through Cloudflare edge points of presence.',
    'Origin IP addresses may be masked behind Cloudflare Anycast routing.',
    'DDoS mitigation and web application firewall rules are evaluated at the edge.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const hasCfRay = context.hasHeader('cf-ray');
    const hasCfCache = context.hasHeader('cf-cache-status');
    const hasCfNs = context.hasNs(/cloudflare\.com/i);

    if (server.includes('cloudflare')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: 'Server: cloudflare',
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Server Header',
        type: 'HEADER',
        indicator: 'server: cloudflare',
        matched: true,
        weight: 10,
      });
    }

    if (hasCfRay) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: cf-ray',
        indicator: 'cf-ray header presence',
        observedValue: context.getHeader('cf-ray'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'CF-Ray Header',
        type: 'HEADER',
        indicator: 'cf-ray',
        matched: true,
        weight: 10,
      });
    }

    if (hasCfCache) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: cf-cache-status',
        indicator: 'cf-cache-status header presence',
        observedValue: context.getHeader('cf-cache-status'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'CF-Cache-Status Header',
        type: 'HEADER',
        indicator: 'cf-cache-status',
        matched: true,
        weight: 8,
      });
    }

    if (hasCfNs) {
      evidence.push({
        sourceType: 'DNS',
        source: 'Nameserver Records (NS)',
        indicator: 'Cloudflare authoritative nameserver',
        observedValue: context.dns?.ns
          ?.filter((ns) => /cloudflare\.com/i.test(ns))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Cloudflare NS',
        type: 'DNS',
        indicator: 'cloudflare.com NS',
        matched: true,
        weight: 8,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    const confidence = evidence.some((e) => e.confidence === 'HIGH')
      ? 0.99
      : 0.85;

    return this.createResult({
      confidence,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Global edge network, reverse proxy, and CDN delivery for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
