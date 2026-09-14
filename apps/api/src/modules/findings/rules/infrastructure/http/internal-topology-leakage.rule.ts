import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { DataLeakageAnalyzerService } from '../../../services/data-leakage-analyzer.service';

@Injectable()
export class InternalTopologyLeakageRule implements FindingRule {
  readonly id = 'http.internal-topology-leakage';
  readonly name = 'Internal IP or Server Topology Disclosed in Headers';
  readonly category = FindingCategory.SECURITY_HEADER;

  constructor(
    private readonly dataLeakageAnalyzer: DataLeakageAnalyzerService,
  ) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    if (
      !http?.reachable ||
      (http.queryStatus && http.queryStatus !== 'SUCCESS')
    ) {
      return [];
    }

    const finalResponse = http.finalResponse;
    const evaluatedHeaders = finalResponse
      ? finalResponse.headers
      : http.headers;
    const evaluatedUrl = finalResponse?.url || http.finalUrl || http.url;

    const observations = this.dataLeakageAnalyzer.analyzeHeaders(
      evaluatedHeaders,
      context.snapshotId,
    );

    const topologyObservations = observations.filter(
      (obs) => obs.type === 'INTERNAL_IP_ROUTING',
    );

    if (topologyObservations.length === 0) {
      return [];
    }

    const headerKeys = topologyObservations.map((o) => `'${o.key}'`).join(', ');
    const rawEvidence = topologyObservations
      .map((o) => o.rawEvidenceRedacted)
      .join('\n');

    return [
      {
        ruleId: this.id,
        title: 'Internal IP or Topology Disclosed in Headers',
        description: `The authoritative HTTP response (${evaluatedUrl}) leaks internal RFC 1918 private IP address(es) or private hostnames in header(s): ${headerKeys}.`,
        category: this.category,
        severity: Severity.MEDIUM,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Internal IP disclosures provide attackers with topology mappings of upstream reverse proxies, private backend instances, and internal VPC segmentation.',
        whatThisDoesNotProve:
          'Disclosing a private IP address does not prove that the internal host is reachable directly from the public internet without passing through perimeter gateways.',
        recommendations: [
          {
            title: 'Strip Internal Routing Headers at Edge Gateway',
            description: `Configure reverse proxy or gateway (NGINX/Cloudflare/Envoy) to remove internal routing headers (${headerKeys}) prior to delivering responses to public clients. (Evidence: ${rawEvidence})`,
          },
        ],
      },
    ];
  }
}
