import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../contracts/finding-context.interface';
import { FindingResult } from '../../contracts/finding-result.interface';
import { FindingRule } from '../../contracts/finding-rule.interface';
import { FindingCategory } from '../../enums/finding-category.enum';
import { Severity } from '../../enums/severity.enum';
import { FindingModule } from '@prisma/client';

@Injectable()
export class ClientIntegrationExposureRule implements FindingRule {
  readonly id = 'tech.client-integration-exposure';
  readonly name = 'Client Integration Exposure Rule';
  readonly category = FindingCategory.TECHNOLOGY;

  // Patterns indicating private secret keys mistakenly exposed in client-side HTML/JS
  private readonly SECRET_KEY_PATTERNS = [
    { pattern: /sk_live_[0-9a-zA-Z]{24,}/, name: 'Stripe Secret Key' },
    { pattern: /sk_test_[0-9a-zA-Z]{24,}/, name: 'Stripe Test Secret Key' },
    { pattern: /ghp_[0-9a-zA-Z]{36}/, name: 'GitHub Personal Access Token' },
    { pattern: /xox[baprs]-[0-9a-zA-Z]{10,48}/, name: 'Slack Token' },
  ];

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const htmlBody = context.snapshot.htmlBody || '';
    if (!htmlBody || htmlBody.trim().length === 0) {
      return [];
    }

    const findings: FindingResult[] = [];

    for (const secretCheck of this.SECRET_KEY_PATTERNS) {
      if (secretCheck.pattern.test(htmlBody)) {
        findings.push({
          ruleId: this.id,
          module: FindingModule.TECHNOLOGY,
          title: `Potential Secret Token Exposed in Client-Side Assets: ${secretCheck.name}`,
          description: `A pattern matching a private or administrative API credential (${secretCheck.name}) was observed within public HTML or script payloads.`,
          category: FindingCategory.TECHNOLOGY,
          severity: Severity.CRITICAL,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'CONFIRMED_SECURITY_CONDITION',
          severityRationale:
            'Disclosing private secret keys in publicly served HTML or client scripts allows unauthorized parties to perform administrative operations or access private backend APIs.',
          whatThisDoesNotProve:
            'This observation identifies a credential pattern in public HTML; it does not confirm active account exploitation or validity without active authentication testing.',
          recommendations: [
            {
              title: 'Revoke and Rotate Exposed Secret Key Immediately',
              description:
                'Immediately revoke the compromised credential in the vendor dashboard, replace it with a newly generated key, and ensure secret keys are stored only in backend environment variables.',
            },
          ],
        });
      }
    }

    return findings;
  }
}
