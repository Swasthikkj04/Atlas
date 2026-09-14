import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { HttpTransitAnalyzerService } from '../../../services/http-transit-analyzer.service';

@Injectable()
export class CleartextUpgradeMissingRule implements FindingRule {
  readonly id = 'http.cleartext-upgrade-missing';
  readonly name = 'Cleartext HTTP to HTTPS Redirection Missing';
  readonly category = FindingCategory.REDIRECT;

  constructor(private readonly transitAnalyzer: HttpTransitAnalyzerService) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const report = this.transitAnalyzer.analyzeTransit(context.snapshot);

    if (!report.isEvaluated || !report.upgradeAudit.hasCleartextExposure) {
      return [];
    }

    const initialStatus = report.upgradeAudit.initialStatusCode || 200;

    return [
      {
        ruleId: this.id,
        title: 'Cleartext HTTP Not Redirected to HTTPS (Port 80 Open)',
        description: `The domain responded to cleartext HTTP requests (status ${initialStatus}) without immediately and permanently redirecting users to encrypted HTTPS. Unencrypted transport leaves web traffic vulnerable to eavesdropping and man-in-the-middle manipulation.`,
        category: this.category,
        severity: Severity.MEDIUM,
        confidence: report.confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Cleartext HTTP allows on-path network adversaries to intercept sensitive credentials, session cookies, and API payloads in transit.',
        whatThisDoesNotProve:
          'This observation proves port 80 responds with cleartext content or fails to enforce HTTPS; it does not prove active network tampering has occurred.',
        recommendations: [
          {
            title: 'Enforce 301 Permanent Redirect to HTTPS',
            description:
              'Configure edge web servers and CDNs to immediately return a 301 or 308 Permanent Redirect to https:// for all incoming cleartext HTTP traffic.',
          },
        ],
      },
    ];
  }
}
