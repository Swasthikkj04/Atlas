import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { DataLeakageAnalyzerService } from '../../../services/data-leakage-analyzer.service';

@Injectable()
export class StackTraceDisclosureRule implements FindingRule {
  readonly id = 'http.stack-trace-disclosure';
  readonly name = 'Stack Trace or Database Error Disclosure';
  readonly category = FindingCategory.RESPONSE;

  constructor(
    private readonly dataLeakageAnalyzer: DataLeakageAnalyzerService,
  ) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const http = context.snapshot.http;
    const htmlBody = context.snapshot.htmlBody;

    // Invariant: HTTP_FINDING_REQUIRES_AUTHORITATIVE_RESPONSE
    if (
      !http?.reachable ||
      (http.queryStatus && http.queryStatus !== 'SUCCESS')
    ) {
      return [];
    }

    const finalResponse = http.finalResponse;
    const evaluatedUrl = finalResponse?.url || http.finalUrl || http.url;

    // Collect all observable content candidates
    const contentSources: string[] = [
      htmlBody || '',
      (http as any)?.body || '',
      (http as any)?.error || '',
      (http as any)?.statusReason || '',
      (finalResponse as any)?.body || '',
    ];

    const contentToEvaluate = contentSources
      .filter((s) => typeof s === 'string' && s.trim().length > 0)
      .join('\n');

    if (!contentToEvaluate) {
      return [];
    }

    const observations = this.dataLeakageAnalyzer.analyzeBodyOrError(
      contentToEvaluate,
      context.snapshotId,
    );

    if (observations.length === 0) {
      return [];
    }

    const primaryObservation = observations[0];
    const isSqlLeak = observations.some((o) => o.type === 'SQL_ERROR_LEAK');

    const title = isSqlLeak
      ? 'Database Query Error Disclosed in Response'
      : 'Unhandled Application Stack Trace Disclosed in Response';

    const rawEvidence = observations
      .map((o) => o.rawEvidenceRedacted)
      .join('\n---\n');

    return [
      {
        ruleId: this.id,
        title,
        description: `The authoritative HTTP response (${evaluatedUrl}) leaks unhandled internal exception details: ${primaryObservation.details}`,
        category: this.category,
        severity: Severity.HIGH,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'CONFIRMED_SECURITY_CONDITION',
        severityRationale: primaryObservation.severityRationale,
        whatThisDoesNotProve: primaryObservation.whatThisDoesNotProve,
        recommendations: [
          {
            title: 'Implement Production Error Boundaries & Exception Masking',
            description: `${primaryObservation.remediationSnippet} (Evidence: ${rawEvidence})`,
          },
        ],
      },
    ];
  }
}
