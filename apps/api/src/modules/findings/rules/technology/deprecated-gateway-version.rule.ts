import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../contracts/finding-context.interface';
import { FindingResult } from '../../contracts/finding-result.interface';
import { FindingRule } from '../../contracts/finding-rule.interface';
import { FindingCategory } from '../../enums/finding-category.enum';
import { Severity } from '../../enums/severity.enum';
import { FindingModule } from '@prisma/client';

@Injectable()
export class DeprecatedGatewayVersionRule implements FindingRule {
  readonly id = 'tech.deprecated-gateway-version';
  readonly name = 'Deprecated Gateway Version Rule';
  readonly category = FindingCategory.TECHNOLOGY;

  private readonly DEPRECATED_PATTERNS = [
    {
      name: 'PHP',
      pattern: /^([0-6]\.|7\.[0-4])/i,
      label: 'PHP 5.x/7.x (End of Life)',
    },
    {
      name: 'Apache',
      pattern: /^2\.[0-2]\./i,
      label: 'Apache 2.0/2.2 (End of Life)',
    },
    {
      name: 'NGINX',
      pattern: /^1\.(0\.|[1-9]\.|1[0-4]\.)/i,
      label: 'Legacy NGINX <= 1.14',
    },
    { name: 'Python', pattern: /^2\./i, label: 'Python 2.x (End of Life)' },
  ];

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const snapshot = context.snapshot;
    const technologies = snapshot.technology?.technologies || [];

    const deprecatedFindings: FindingResult[] = [];

    for (const tech of technologies) {
      if (!tech.version) continue;

      for (const deprecation of this.DEPRECATED_PATTERNS) {
        if (
          tech.name.toLowerCase().includes(deprecation.name.toLowerCase()) &&
          deprecation.pattern.test(tech.version)
        ) {
          deprecatedFindings.push({
            ruleId: this.id,
            module: FindingModule.TECHNOLOGY,
            title: `Legacy / End-of-Life Gateway Component: ${tech.name}`,
            description: `The public endpoint advertises ${tech.name} version ${tech.version}, which corresponds to a legacy or end-of-life release line (${deprecation.label}).`,
            category: FindingCategory.TECHNOLOGY,
            severity: Severity.MEDIUM,
            confidence: 'AUTHORITATIVE',
            riskClassification: 'SECURITY_HARDENING_GAP',
            severityRationale:
              'End-of-life software branches no longer receive security patches from upstream maintainers, increasing exposure to known vulnerabilities over time.',
            whatThisDoesNotProve:
              'This finding is derived from the publicly advertised version banner and does not confirm backported distribution patches or active exploitability.',
            recommendations: [
              {
                title: `Upgrade ${tech.name} to Current Supported Release`,
                description:
                  'Migrate to an actively maintained release branch to receive critical security updates and vulnerability patches.',
              },
            ],
          });
        }
      }
    }

    return deprecatedFindings;
  }
}
