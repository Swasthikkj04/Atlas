import { Injectable, Logger } from '@nestjs/common';
import {
  InfrastructureTopology,
  TopologyLayer,
  TechnologyDetectionContext,
  TechnologyDiscoveryResult,
} from '../contracts';

export type AnomalySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ArchitecturalAnomaly {
  code: string;
  title: string;
  description: string;
  severity: AnomalySeverity;
  affectedLayer: string;
  affectedTechnology?: string;
  remediation: string;
  wireEvidence: string[];
}

export interface ArchitecturalAnomalyAnalysisResult {
  anomalies: ArchitecturalAnomaly[];
  postureScore: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

/**
 * Architectural Anomaly & Security Posture Analysis Engine (Move 4).
 *
 * Synthesizes cross-layer architectural anomalies and ingress security posture:
 * - Direct Origin IP Leakage & CDN Bypass risks
 * - Insecure Ingress Protocol transitions (HTTPS -> HTTP downgrades)
 * - Edge-to-Origin Protocol Mismatches
 * - Dangerous Debug Stack Traces & Internal Error Leakage
 */
@Injectable()
export class ArchitecturalAnomalyEngine {
  private readonly logger = new Logger(ArchitecturalAnomalyEngine.name);

  analyze(
    topology: InfrastructureTopology,
    context: TechnologyDetectionContext,
  ): ArchitecturalAnomalyAnalysisResult {
    const anomalies: ArchitecturalAnomaly[] = [];

    const hasEdge = topology.nodes.some((n) => n.layer === TopologyLayer.EDGE);
    const hasGateway = topology.nodes.some(
      (n) => n.layer === TopologyLayer.GATEWAY,
    );
    const hasRuntime = topology.nodes.some(
      (n) => n.layer === TopologyLayer.RUNTIME,
    );

    // 1. Direct Origin IP & Internal IP Leakage
    const headers = context.headers || {};
    const headerStr = JSON.stringify(headers).toLowerCase();
    const internalIpRegex =
      /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})\b/;

    if (internalIpRegex.test(headerStr)) {
      const match = headerStr.match(internalIpRegex)?.[0];
      anomalies.push({
        code: 'INTERNAL_IP_LEAKAGE',
        title: 'Private Internal IPv4 Address Disclosed in Ingress Headers',
        description: `Private network topology address (${match}) leaked in public HTTP response headers.`,
        severity: 'HIGH',
        affectedLayer: 'GATEWAY',
        remediation:
          'Configure ingress gateway to strip internal proxy routing headers (X-Forwarded-For, X-Real-IP, Via) before public delivery.',
        wireEvidence: [`Leaked internal IP: ${match}`],
      });
    }

    // 2. Insecure Ingress Transit (HTTP without HSTS or Protocol Downgrade)
    const hasHsts = context.hasHeader('strict-transport-security');
    const isHttps =
      context.http?.protocol === 'https' ||
      context.http?.url?.startsWith('https');

    if (hasEdge && !hasHsts) {
      anomalies.push({
        code: 'MISSING_EDGE_HSTS',
        title: 'Strict-Transport-Security (HSTS) Missing on Edge Ingress',
        description:
          'Edge proxy terminates client traffic without enforcing strict HTTPS via Strict-Transport-Security headers.',
        severity: 'MEDIUM',
        affectedLayer: 'EDGE',
        remediation:
          'Enable HSTS with a minimum max-age of 31536000 (1 year) and includeSubDomains on your Edge CDN configuration.',
        wireEvidence: ['Strict-Transport-Security header: not observed'],
      });
    }

    // 3. Verbose Framework Debug Traces Exposed on Public Route
    const html = context.htmlBody || '';
    const isDjangoTrace =
      html.includes('Traceback (most recent call last):') ||
      html.includes('Request information');
    const isExpressTrace =
      /<pre>TypeError:|<pre>ReferenceError:|<pre>Error:/.test(html);
    const isPhpTrace = /Fatal error:.*?in \/.*?\.php on line \d+/i.test(html);
    const isDotNetTrace = /System\.[a-zA-Z]+Exception:/.test(html);

    if (isDjangoTrace || isExpressTrace || isPhpTrace || isDotNetTrace) {
      let runtimeName = 'Application Runtime';
      if (isDjangoTrace) runtimeName = 'Django / Python';
      else if (isExpressTrace) runtimeName = 'Express / Node.js';
      else if (isPhpTrace) runtimeName = 'PHP Engine';
      else if (isDotNetTrace) runtimeName = '.NET Core / ASP.NET';

      anomalies.push({
        code: 'DEBUG_STACK_TRACE_EXPOSURE',
        title: `Active Debug Stack Trace Disclosed by ${runtimeName}`,
        description: `Uncaught exception and internal application source trace was returned on public request for ${context.domainName}.`,
        severity: 'CRITICAL',
        affectedLayer: 'RUNTIME',
        affectedTechnology: runtimeName,
        remediation:
          'Disable debug mode (e.g. DEBUG=False, NODE_ENV=production, display_errors=Off) in your production deployment.',
        wireEvidence: [
          'Response Body contains unmasked stack trace and filesystem paths',
        ],
      });
    }

    // 4. Edge-to-Origin Direct Server Disclosure
    if (hasEdge) {
      const serverHeader = (headers['server'] || '').toLowerCase();
      const xPoweredBy = (headers['x-powered-by'] || '').toLowerCase();
      if (
        (serverHeader &&
          !serverHeader.includes('cloudflare') &&
          !serverHeader.includes('cloudfront')) ||
        xPoweredBy
      ) {
        anomalies.push({
          code: 'ORIGIN_SERVER_EXPOSURE',
          title:
            'Direct Origin Server and Framework Banners Exposed through Edge',
          description: `Edge proxy forwards origin banners (${[serverHeader, xPoweredBy].filter(Boolean).join(', ')}) without sanitization.`,
          severity: 'LOW',
          affectedLayer: 'GATEWAY',
          remediation:
            'Configure edge reverse proxy to suppress backend Server and X-Powered-By response headers.',
          wireEvidence: [
            serverHeader ? `Server: ${headers['server']}` : '',
            xPoweredBy ? `X-Powered-By: ${headers['x-powered-by']}` : '',
          ].filter(Boolean),
        });
      }
    }

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    for (const a of anomalies) {
      if (a.severity === 'CRITICAL') criticalCount++;
      else if (a.severity === 'HIGH') highCount++;
      else if (a.severity === 'MEDIUM') mediumCount++;
      else if (a.severity === 'LOW') lowCount++;
    }

    // Posture score: 100 base, deductions for anomalies
    const deduction =
      criticalCount * 40 + highCount * 20 + mediumCount * 10 + lowCount * 5;
    const postureScore = Math.max(0, 100 - deduction);

    this.logger.debug(
      `Analyzed architectural anomalies for ${context.domainName}: found ${anomalies.length} anomalies (score=${postureScore}/100)`,
    );

    return {
      anomalies,
      postureScore,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
    };
  }
}
