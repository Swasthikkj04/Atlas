import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { DataLeakageAnalyzerService } from '../../../services/data-leakage-analyzer.service';

@Injectable()
export class DebugHeaderExposureRule implements FindingRule {
  readonly id = 'http.debug-header-exposed';
  readonly name = 'Diagnostic or Debug Header Exposure';
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

    const debugHeaderObservations = observations.filter(
      (obs) =>
        obs.type === 'DEBUG_HEADER' || obs.type === 'DIAGNOSTIC_SOURCEMAP',
    );

    if (debugHeaderObservations.length === 0) {
      return [];
    }

    const highestSeverity = debugHeaderObservations.some(
      (o) => o.severity === Severity.HIGH,
    )
      ? Severity.HIGH
      : debugHeaderObservations.some((o) => o.severity === Severity.MEDIUM)
        ? Severity.MEDIUM
        : Severity.LOW;

    const headerKeys = debugHeaderObservations
      .map((o) => `'${o.key}'`)
      .join(', ');
    const rawEvidence = debugHeaderObservations
      .map((o) => o.rawEvidenceRedacted)
      .join('\n');

    return [
      {
        ruleId: this.id,
        title: 'Diagnostic or Debug Headers Exposed in HTTP Response',
        description: `The authoritative HTTP response (${evaluatedUrl}) exposes internal diagnostic or debug header(s): ${headerKeys}.`,
        category: this.category,
        severity: highestSeverity,
        confidence: 'AUTHORITATIVE',
        riskClassification:
          highestSeverity === Severity.HIGH
            ? 'CONFIRMED_SECURITY_CONDITION'
            : 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Exposed debug headers and profiler tokens reveal internal framework telemetry, routing metadata, and performance profiling hooks to external observers.',
        whatThisDoesNotProve:
          'Exposure of debug headers indicates active diagnostic telemetry but does not prove that interactive debug endpoints are unauthenticated or vulnerable to remote execution.',
        recommendations: [
          {
            title: 'Disable Development & Profiler Headers in Production',
            description: `Remove diagnostic headers (${headerKeys}) by disabling application debug modes (e.g. APP_DEBUG=false, profiler.enabled: false). (Evidence: ${rawEvidence})`,
          },
        ],
      },
    ];
  }
}
