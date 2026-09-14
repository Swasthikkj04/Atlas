import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../contracts/finding-context.interface';
import { FindingResult } from '../../contracts/finding-result.interface';
import { FindingRule } from '../../contracts/finding-rule.interface';
import { FindingCategory } from '../../enums/finding-category.enum';
import { Severity } from '../../enums/severity.enum';
import { FindingModule } from '@prisma/client';

@Injectable()
export class TechnologyVersionExposureRule implements FindingRule {
  readonly id = 'tech.version-exposure';
  readonly name = 'Technology Version Exposure Rule';
  readonly category = FindingCategory.TECHNOLOGY;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const snapshot = context.snapshot;
    const technologies = snapshot.technology?.technologies || [];

    const exposedWithVersion = technologies.filter(
      (t) => t.version && t.version.trim().length > 0,
    );

    if (exposedWithVersion.length === 0) {
      return [];
    }

    const versionList = exposedWithVersion
      .map((t) => `${t.name} (v${t.version})`)
      .join(', ');

    return [
      {
        ruleId: this.id,
        module: FindingModule.TECHNOLOGY,
        title: 'Technology Version Information Publicly Disclosed',
        description: `Exact software version numbers are publicly disclosed through HTTP response headers: ${versionList}.`,
        category: FindingCategory.TECHNOLOGY,
        severity: Severity.LOW,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'INFORMATIONAL_OBSERVATION',
        severityRationale:
          'Advertising granular software version banners assists automated scanner reconnaissance and targeted version-specific vulnerability mapping.',
        whatThisDoesNotProve:
          'Version exposure alone does not prove the presence of an exploitable vulnerability. It represents an informational disclosure that aids attacker reconnaissance.',
        recommendations: [
          {
            title: 'Suppress Detailed Software Version Banners',
            description:
              'Configure web servers and reverse proxies to omit detailed version numbers (e.g. server_tokens off in NGINX, ServerSignature Off in Apache, or expose_php = Off in PHP).',
          },
        ],
      },
    ];
  }
}
