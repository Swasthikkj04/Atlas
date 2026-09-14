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
export class GcpDetector extends BaseTechnologyDetector {
  readonly id = 'tech-google-cloud';
  readonly name = 'Google Cloud Platform (GCP)';
  readonly category = TechnologyCategory.CLOUD_INFRASTRUCTURE;
  readonly description =
    'Google Cloud Platform (GCP) cloud infrastructure, Cloud Load Balancing, Google Frontend (GFE), Cloud Run, App Engine, and Cloud DNS';
  readonly role = 'Cloud Infrastructure & Managed Services';
  readonly infrastructureMeaning =
    'Observable Google Cloud Platform managed infrastructure (such as Cloud Load Balancing, Google Frontend, Cloud Run, or Cloud DNS) participates in delivering the public endpoint.';
  readonly detectionSignals = [
    'Server header containing gws, gse, esf, sffe, or Google Frontend',
    'x-cloud-trace-context response header (Cloud Trace / Cloud Run / App Engine)',
    'x-goog-meta or other Google custom metadata headers',
    'CNAME pointing to appspot.com, run.app, a.run.app, or cloud.google.com',
    'Authoritative nameservers on googledomains.com or ns-cloud-*.googledomains.com',
    'TLS certificate issued by Google Trust Services (GTS CA)',
  ];
  readonly confidenceRules =
    'HIGH confidence when Google Frontend (GFE/GSE/ESF) server banners, GCP trace headers, or GCP CNAMEs are observed.';
  readonly whatThisDoesNotProve =
    'Observable Google Cloud infrastructure confirms participation of specific GCP-managed components (such as Google Cloud Load Balancing, Google Cloud CDN, Cloud DNS, Cloud Run, or App Engine), but does not prove the entire application runs on GCP, nor does it establish Google Kubernetes Engine (GKE), Compute Engine VMs, Cloud Functions, Cloud SQL, Spanner, Bigtable, Firestore, MemoryStore, private VPC Service Controls, Linux kernel version, or backend database services without direct evidence.';
  readonly defaultImplications = [
    'Inbound traffic reaches Google Cloud-managed infrastructure or Google Frontend (GFE) edge proxies.',
    'Cloud routing, SSL termination, or load balancing occurs within Google Cloud network boundaries.',
    'Origin backend compute, container orchestrators, and database tiers remain isolated behind Google Cloud service boundaries.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const hasTrace = context.hasHeader('x-cloud-trace-context');
    const hasGcpCname = context.hasCname(
      /appspot\.com|cloud\.google\.com|run\.app|a\.run\.app|googlehosted\.com/i,
    );
    const hasGoogleDns = context.dns?.ns?.some((ns) =>
      /googledomains\.com|ns-cloud/i.test(ns),
    );
    const isGoogleTls = context.hasCertIssuer(
      /google trust services|gts ca|google internet authority/i,
    );

    const isGoogleServer =
      server.includes('gws') ||
      server.includes('gse') ||
      server.includes('esf') ||
      server.includes('sffe') ||
      server.includes('google frontend') ||
      server.includes('gfe');

    // 1. Google Server Banner (GFE / GSE / ESF / GWS)
    if (isGoogleServer) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Google Gateway Server Banner (${context.getHeader('server')})`,
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Google Server Banner',
        type: 'HEADER',
        indicator: server,
        matched: true,
        weight: 9,
      });
    }

    // 2. Cloud Trace Context Header
    if (hasTrace) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-cloud-trace-context',
        indicator: 'Google Cloud Trace request tracing header',
        observedValue: context.getHeader('x-cloud-trace-context'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'GCP Cloud Trace',
        type: 'HEADER',
        indicator: 'x-cloud-trace-context',
        matched: true,
        weight: 9,
      });
    }

    // 3. GCP CNAME Target (appspot.com, run.app, cloud.google.com, googlehosted.com)
    if (hasGcpCname) {
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'Google Cloud CNAME target',
        observedValue: context.dns?.cname
          ?.filter((c) =>
            /appspot\.com|cloud\.google\.com|run\.app|a\.run\.app|googlehosted\.com/i.test(
              c,
            ),
          )
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'GCP CNAME',
        type: 'DNS',
        indicator: 'appspot.com / run.app CNAME',
        matched: true,
        weight: 9,
      });
    }

    // 4. Google Cloud DNS
    if (hasGoogleDns) {
      evidence.push({
        sourceType: 'DNS',
        source: 'Nameserver Records (NS)',
        indicator: 'Google Cloud DNS authoritative nameservers',
        observedValue: context.dns?.ns
          ?.filter((ns) => /googledomains\.com|ns-cloud/i.test(ns))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Google Cloud DNS',
        type: 'DNS',
        indicator: 'googledomains.com / ns-cloud NS',
        matched: true,
        weight: 8,
      });
    }

    // 5. Google Trust Services TLS Certificate
    if (isGoogleTls) {
      const issuerStr =
        typeof context.ssl?.certificate?.issuer === 'string'
          ? context.ssl.certificate.issuer
          : typeof context.ssl?.certificate?.issuer === 'object'
            ? (context.ssl.certificate.issuer as any).organization ||
              JSON.stringify(context.ssl.certificate.issuer)
            : (context.ssl as any)?.issuer || 'Google Trust Services';

      evidence.push({
        sourceType: 'TLS',
        source: 'TLS Certificate Issuer',
        indicator: 'Google Trust Services (GTS) Certificate Authority',
        observedValue: issuerStr,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Google Trust Services TLS CA',
        type: 'TLS',
        indicator: issuerStr || 'Google Trust Services',
        matched: true,
        weight: 8,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    // Determine specific role based on detected surfaces
    let role = 'Cloud Infrastructure & Managed Services';
    if (hasTrace || hasGcpCname) {
      role = 'Cloud Ingress & Managed Platform';
    } else if (hasGoogleDns && evidence.length === 1) {
      role = 'Authoritative DNS (Google Cloud DNS)';
    }

    return this.createResult({
      confidence: 0.95,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role,
      infrastructureMeaning: this.infrastructureMeaning,
      whatThisDoesNotProve: this.whatThisDoesNotProve,
    });
  }
}
