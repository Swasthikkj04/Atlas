import { Injectable } from '@nestjs/common';
import { FindingResult } from '../../findings/contracts/finding-result.interface';
import { InfrastructureFindingRepository } from '../repositories/infrastructure-finding.repository';
import { FindingMapper } from '../mappers/finding.mapper';

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
        recommendations: JSON.parse(
          JSON.stringify(finding.recommendations),
        ),
      })),
    );
  }

  async getFindingsBySnapshot(
    snapshotId: string,
    page: number,
    limit: number,
  ) {
    const [findings, total] = await Promise.all([
      this.repository.findBySnapshot(snapshotId, page, limit),
      this.repository.countBySnapshot(snapshotId),
    ]);

    return {
      data: findings.map((finding) => FindingMapper.toDto(finding)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}