import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../contracts/finding-context.interface';
import { FindingResult } from '../../contracts/finding-result.interface';
import { FindingRule } from '../../contracts/finding-rule.interface';
import { FindingCategory } from '../../enums/finding-category.enum';
import { Severity } from '../../enums/severity.enum';
import { FindingModule } from '@prisma/client';

@Injectable()
export class RuntimeDebugTraceExposureRule implements FindingRule {
  readonly id = 'tech.runtime-debug-trace-exposure';
  readonly name = 'Runtime Debug Trace & Error Leakage Rule';
  readonly category = FindingCategory.TECHNOLOGY;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const snapshot = context.snapshot;
    const rawPayload: any =
      (snapshot.http as any)?.evidenceResult?.rawPayload || {};
    const htmlBody: string =
      (snapshot as any)?.htmlBody ||
      (snapshot.http as any)?.htmlBody ||
      rawPayload.htmlBody ||
      rawPayload.body ||
      '';

    if (!htmlBody) return [];

    const isDjangoTrace =
      htmlBody.includes('Traceback (most recent call last):') ||
      (htmlBody.includes('Django Version:') &&
        htmlBody.includes('Exception Type:'));
    const isExpressTrace =
      /<pre>(?:TypeError|ReferenceError|SyntaxError|Error):/i.test(htmlBody) &&
      htmlBody.includes('at ');
    const isPhpTrace = /Fatal error:.*?in \/.*?\.php on line \d+/i.test(
      htmlBody,
    );
    const isDotNetTrace =
      /System\.[a-zA-Z]+Exception:/i.test(htmlBody) && htmlBody.includes('at ');

    if (isDjangoTrace || isExpressTrace || isPhpTrace || isDotNetTrace) {
      let runtime = 'Application Runtime';
      if (isDjangoTrace) runtime = 'Django / Python';
      else if (isExpressTrace) runtime = 'Express / Node.js';
      else if (isPhpTrace) runtime = 'PHP';
      else if (isDotNetTrace) runtime = '.NET Core / ASP.NET';

      return [
        {
          ruleId: this.id,
          module: FindingModule.TECHNOLOGY,
          title: `Active Debug Stack Trace Disclosed by ${runtime}`,
          description: `An unhandled exception and internal execution stack trace from ${runtime} was returned on the public HTTP response for ${(context.snapshot as any)?.domain || context.domainId}.`,

          category: FindingCategory.TECHNOLOGY,
          severity: Severity.CRITICAL,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'CONFIRMED_SECURITY_CONDITION',
          severityRationale:
            'Exposing internal stack traces reveals source code file paths, internal module names, database query structures, and runtime versions, assisting exploitation.',
          whatThisDoesNotProve:
            'This observation proves sensitive debugging output was exposed; it does not prove database records were compromised.',
          recommendations: [
            {
              title: 'Disable Development Debug Mode in Production',
              description:
                'Set environment variables to production mode (e.g. DEBUG=False, NODE_ENV=production, display_errors=Off) and return custom error pages without stack traces.',
            },
          ],
        },
      ];
    }

    return [];
  }
}
