import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { PerimeterExposureAnalyzerService } from '../../../services/perimeter-exposure-analyzer.service';

@Injectable()
export class EnvFileExposureRule implements FindingRule {
  readonly id = 'security.env-file-exposure';
  readonly name = 'Exposed Environment Configuration & Secrets File';
  readonly category = FindingCategory.SECURITY_HEADER;

  constructor(
    private readonly perimeterAnalyzer: PerimeterExposureAnalyzerService,
  ) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const report = this.perimeterAnalyzer.analyzePerimeter(context.snapshot);

    if (!report.isEvaluated || !report.envAudit.isEnvFileExposed) {
      return [];
    }

    const keysList = report.envAudit.sensitiveKeysDetected.join(', ');

    return [
      {
        ruleId: this.id,
        title: 'Publicly Accessible .env Environment Configuration File',
        description: `The application serves environment configuration files (.env) containing sensitive variable definitions (${keysList}) to public HTTP requests. This permits immediate exposure of production database credentials, API keys, and cryptographic secrets.`,
        category: this.category,
        severity: Severity.CRITICAL,
        confidence: report.confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Exposure of .env files compromises all downstream credentials, allowing direct database access and unauthorized cloud resource control.',
        whatThisDoesNotProve:
          'This finding proves sensitive key definitions are readable over HTTP; it does not prove active exploitation or unauthorized database sessions.',
        recommendations: [
          {
            title:
              'Block Public Requests to .env Files and Rotate Compromised Secrets',
            description:
              'Immediately deny HTTP access to .env, .env.*, and related config files at the ingress reverse proxy, and rotate all exposed database and API credentials.',
          },
        ],
      },
    ];
  }
}
