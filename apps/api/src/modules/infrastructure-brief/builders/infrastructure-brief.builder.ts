import { Injectable } from '@nestjs/common';
import { SnapshotDetailDto } from '../../infrastructure-snapshots/dto/snapshot-detail.dto';
import { FindingDto } from '../../infrastructure-findings/dto/finding.dto';
import {
  InfrastructureBriefResult,
  InfrastructureBriefRecommendation,
} from '../contracts/infrastructure-brief-result.interface';

@Injectable()
export class InfrastructureBriefBuilder {
  build(
    snapshot: SnapshotDetailDto,
    findings: FindingDto[],
  ): InfrastructureBriefResult {
    const critical = findings.filter(
      (finding) => finding.severity === 'CRITICAL',
    ).length;

    const high = findings.filter(
      (finding) => finding.severity === 'HIGH',
    ).length;

    let overallHealth = 'Excellent';

    if (critical > 0) {
      overallHealth = 'Critical';
    } else if (high > 0) {
      overallHealth = 'Poor';
    } else if (findings.length > 0) {
      overallHealth = 'Fair';
    }

    return {
      overallHealth,
      summary: `Atlas analyzed the target infrastructure and identified ${findings.length} finding(s), including ${critical} critical and ${high} high severity issue(s). Overall infrastructure health is ${overallHealth}.`,
      highlights: findings
        .filter(
          (finding) =>
            finding.severity === 'CRITICAL' || finding.severity === 'HIGH',
        )
        .slice(0, 5)
        .map((finding) => ({
          severity: finding.severity,
          title: finding.title,
          description: finding.description,
        })),
      recommendations: [
        ...new Map(
          findings
            .flatMap((finding) =>
              Array.isArray(finding.recommendations)
                ? finding.recommendations
                : [],
            )
            .map((recommendation: InfrastructureBriefRecommendation) => [
              recommendation.title,
              recommendation,
            ]),
        ).values(),
      ].slice(0, 5),
    };
  }
}
