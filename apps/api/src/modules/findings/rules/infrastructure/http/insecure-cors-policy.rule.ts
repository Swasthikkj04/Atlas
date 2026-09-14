import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { HttpTransitAnalyzerService } from '../../../services/http-transit-analyzer.service';

@Injectable()
export class InsecureCorsPolicyRule implements FindingRule {
  readonly id = 'http.insecure-cors-policy';
  readonly name = 'Insecure CORS Access Policy';
  readonly category = FindingCategory.SECURITY_HEADER;

  constructor(private readonly transitAnalyzer: HttpTransitAnalyzerService) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const report = this.transitAnalyzer.analyzeTransit(context.snapshot);

    if (!report.isEvaluated || !report.corsAudit.isOverlyPermissive) {
      return [];
    }

    const isWildcardWithCreds = report.corsAudit.isWildcardWithCredentials;
    const origin = report.corsAudit.allowOrigin;

    return [
      {
        ruleId: this.id,
        title: isWildcardWithCreds
          ? 'Overly Permissive CORS Policy with Credentials Allowed'
          : 'Wildcard CORS Origin Policy Configured',
        description: isWildcardWithCreds
          ? 'The server returns Access-Control-Allow-Origin: * while also specifying Access-Control-Allow-Credentials: true, creating a critical browser trust conflict and credential leakage vulnerability.'
          : `The server returns Access-Control-Allow-Origin: ${origin}, allowing arbitrary external origins to read responses across domain boundaries via client-side scripts.`,
        category: this.category,
        severity: isWildcardWithCreds ? Severity.HIGH : Severity.MEDIUM,
        confidence: report.confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale: isWildcardWithCreds
          ? 'Combining wildcard origin permissions with credentialed requests allows unauthorized cross-origin access to authenticated application endpoints.'
          : 'Wildcard origin reflection allows any third-party domain to read API responses from user browsers.',
        whatThisDoesNotProve:
          'This observation proves the HTTP response headers declare a permissive CORS policy; it does not prove sensitive user data has been extracted by external sites.',
        recommendations: [
          {
            title: 'Restrict Access-Control-Allow-Origin to Trusted Domains',
            description:
              'Replace wildcard (*) or unrestricted origin reflection with an explicit whitelist of trusted application domains.',
          },
        ],
      },
    ];
  }
}
