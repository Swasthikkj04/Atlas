import { Injectable } from '@nestjs/common';
import { FindingResult } from '../../findings/contracts/finding-result.interface';
import { InfrastructureFindingRepository } from '../repositories/infrastructure-finding.repository';

@Injectable()
export class InfrastructureFindingService {
  constructor(
    private readonly repository: InfrastructureFindingRepository,
  ) {}

  async saveFindings(
    snapshotId: string,
    findings: FindingResult[],
  ): Promise<void> {
    if (findings.length === 0) {
      return;
    }

    await this.repository.createMany(
      findings.map((finding) => ({
        snapshotId,
        ruleId: finding.ruleId,
        title: finding.title,
        description: finding.description,
        severity: finding.severity,
        category: finding.category,
        recommendations: finding.recommendations,
      })),
    );
  }
}