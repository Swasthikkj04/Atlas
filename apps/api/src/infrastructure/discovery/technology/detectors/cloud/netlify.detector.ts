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
export class NetlifyDetector extends BaseTechnologyDetector {
  readonly id = 'tech-netlify';
  readonly name = 'Netlify';
  readonly category = TechnologyCategory.CLOUD_INFRASTRUCTURE;
  readonly description =
    'Netlify global edge platform, automated static web hosting, and serverless substrate';
  readonly role = 'Edge Platform / Static & Serverless Ingress';
  readonly infrastructureMeaning =
    'The public endpoint appears to use Netlify for edge delivery, asset distribution, and static/serverless web hosting.';
  readonly detectionSignals = [
    'x-nf-request-id response header',
    'Server: Netlify response header',
    'x-nf-account-id or x-nf-deploy-id response headers',
    'netlify.app in CNAME records',
    'netlify DNS nameservers',
    'netlify.app in TLS certificate SAN',
  ];
  readonly confidenceRules =
    'HIGH confidence when x-nf-request-id header, Server: Netlify, or netlify.app CNAME/SAN is observed.';
  readonly whatThisDoesNotProve =
    'Netlify edge platform evidence confirms edge delivery and routing, but does not prove React, Vue, Svelte, SvelteKit, Astro, JAMstack architecture, Netlify Functions, origin cloud hosting (AWS), Docker containerization, Kubernetes orchestration, or backend database services without direct independent evidence.';
  readonly defaultImplications = [
    'Public frontend and edge functions execute on Netlify global edge network.',
    'Automated TLS, static asset CDN, and routing are managed by Netlify infrastructure.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const hasNfRequestId = context.hasHeader('x-nf-request-id');
    const hasNetlifyCname = context.hasCname(/netlify\.app|netlify\.com/i);
    const hasNetlifySan = context.hasCertSan(/netlify\.app/i);
    const hasNetlifyNs =
      context.dns?.ns?.some((n) => /nsone\.net|netlify/i.test(n)) ?? false;

    if (hasNfRequestId) {
      const nfReqId = context.getHeader('x-nf-request-id');
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-nf-request-id',
        indicator: 'Netlify request identifier header',
        observedValue: nfReqId,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Netlify Request ID',
        type: 'HEADER',
        indicator: `x-nf-request-id: ${nfReqId}`,
        matched: true,
        weight: 10,
      });
    }

    if (server === 'netlify' || server.includes('netlify')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: 'Server: Netlify',
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Netlify Server Header',
        type: 'HEADER',
        indicator: 'server: netlify',
        matched: true,
        weight: 9,
      });
    }

    // Additional Netlify edge headers
    const netlifyHeaders = [
      'x-nf-account-id',
      'x-nf-deploy-id',
      'x-nf-cache-status',
      'x-nf-image-optimization',
      'x-nf-country',
      'x-nf-geo',
    ];
    for (const h of netlifyHeaders) {
      if (context.hasHeader(h)) {
        const val = context.getHeader(h);
        evidence.push({
          sourceType: 'HTTP',
          source: `Response Header: ${h}`,
          indicator: `Netlify edge telemetry (${h})`,
          observedValue: val,
          confidence: 'HIGH',
        });
        signals.push({
          name: `Netlify ${h}`,
          type: 'HEADER',
          indicator: `${h}: ${val}`,
          matched: true,
          weight: 7,
        });
      }
    }

    if (hasNetlifyCname) {
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'Netlify CNAME routing target',
        observedValue: context.dns?.cname
          ?.filter((c) => /netlify\.app|netlify\.com/i.test(c))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Netlify CNAME',
        type: 'DNS',
        indicator: 'netlify.app CNAME',
        matched: true,
        weight: 9,
      });
    }

    if (
      hasNetlifyNs &&
      (hasNfRequestId || hasNetlifyCname || server.includes('netlify'))
    ) {
      evidence.push({
        sourceType: 'DNS',
        source: 'NS Records',
        indicator: 'Netlify DNS Nameservers',
        observedValue: context.dns?.ns
          ?.filter((n) => /nsone\.net|netlify/i.test(n))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Netlify NS',
        type: 'DNS',
        indicator: 'Netlify nameservers',
        matched: true,
        weight: 8,
      });
    }

    if (hasNetlifySan) {
      evidence.push({
        sourceType: 'TLS',
        source: 'Certificate SAN',
        indicator: 'Netlify wildcard domain in certificate SAN',
        observedValue: context.ssl?.certificate?.subjectAltName,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Netlify TLS SAN',
        type: 'CERTIFICATE',
        indicator: 'netlify.app SAN',
        matched: true,
        weight: 8,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    const whyDetected = `Observed Netlify edge platform telemetry (${evidence
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
