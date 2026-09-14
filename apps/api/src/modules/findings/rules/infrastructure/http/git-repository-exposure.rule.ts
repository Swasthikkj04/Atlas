import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { PerimeterExposureAnalyzerService } from '../../../services/perimeter-exposure-analyzer.service';

@Injectable()
export class GitRepositoryExposureRule implements FindingRule {
  readonly id = 'security.git-repository-exposure';
  readonly name = 'Exposed Git Source Repository Metadata';
  readonly category = FindingCategory.SECURITY_HEADER;

  constructor(
    private readonly perimeterAnalyzer: PerimeterExposureAnalyzerService,
  ) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const report = this.perimeterAnalyzer.analyzePerimeter(context.snapshot);

    if (!report.isEvaluated || !report.gitAudit.isGitRepoExposed) {
      return [];
    }

    const ref = report.gitAudit.refDetected || 'Git HEAD';

    return [
      {
        ruleId: this.id,
        title: 'Exposed Git Repository Metadata Detected (/.git/HEAD)',
        description: `The web server exposes Git internal repository files (${ref}) to the public internet. Attackers can reconstruct the complete application source code, commit history, and embedded credentials.`,
        category: this.category,
        severity: Severity.CRITICAL,
        confidence: report.confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Public access to .git metadata enables complete source code extraction and exposes hardcoded secrets and proprietary architecture.',
        whatThisDoesNotProve:
          'This observation proves the .git metadata is publicly readable; it does not prove code was downloaded by unauthorized external entities.',
        recommendations: [
          {
            title: 'Block Access to .git and Hidden Directories',
            description:
              'Configure web server rules (e.g. NGINX `location ~ /\\.git { deny all; }` or Cloudflare WAF block rules) to deny public requests to all hidden dotfiles.',
          },
        ],
      },
    ];
  }
}
