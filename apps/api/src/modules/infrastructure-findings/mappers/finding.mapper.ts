import { InfrastructureFinding } from '@prisma/client';

import { FindingDto } from '../dto/finding.dto';

export class FindingMapper {
  static toDto(
    finding: InfrastructureFinding,
  ): FindingDto {
    return {
      id: finding.id,
      title: finding.title,
      description: finding.description,
      severity: finding.severity,
      category: finding.category,
      createdAt: finding.createdAt,
    };
  }
}