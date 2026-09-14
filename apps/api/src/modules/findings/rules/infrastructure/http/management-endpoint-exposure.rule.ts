import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { PerimeterExposureAnalyzerService } from '../../../services/perimeter-exposure-analyzer.service';

@Injectable()
export class ManagementEndpointExposureRule implements FindingRule {
  readonly id = 'security.management-endpoint-exposure';
  readonly name = 'Exposed Internal Management or Diagnostic Endpoints';
  readonly category = FindingCategory.RESPONSE;

  constructor(
    private readonly perimeterAnalyzer: PerimeterExposureAnalyzerService,
  ) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const report = this.perimeterAnalyzer.analyzePerimeter(context.snapshot);

    if (
      !report.isEvaluated ||
      report.managementAudit.exposedServices.length === 0
    ) {
      return [];
    }

    const services = report.managementAudit.exposedServices.join(', ');

    return [
      {
        ruleId: this.id,
        title: `Publicly Accessible Management Telemetry & Diagnostic Interface: ${services}`,
        description: `The application publicly exposes internal diagnostics, telemetry, or API introspection interfaces (${services}) without requiring authentication. Attackers can map internal application state, thread dumps, memory layouts, or API structure.`,
        category: this.category,
        severity: Severity.HIGH,
        confidence: report.confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Unprotected diagnostic endpoints (e.g. Prometheus metrics, Actuator, Swagger, or GraphQL introspection) leak private architecture metrics and facilitate automated exploitation.',
        whatThisDoesNotProve:
          'This observation proves the endpoint is reachable without credentials; it does not prove data modification or write operations are possible.',
        recommendations: [
          {
            title:
              'Restrict Diagnostic and Telemetry Endpoints to Internal Networks',
            description:
              'Require mutual TLS (mTLS), internal network access only, or strong OAuth/Bearer authentication for /metrics, /actuator, and API explorer routes.',
          },
        ],
      },
    ];
  }
}
