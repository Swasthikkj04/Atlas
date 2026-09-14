import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingReferrerPolicyRule implements FindingRule {
  readonly id = 'http.missing-referrer-policy';

  readonly name = 'Missing Referrer-Policy Header';
  readonly category = FindingCategory.SECURITY_HEADER;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    if (
      !http?.reachable ||
      (http.queryStatus && http.queryStatus !== 'SUCCESS')
    ) {
      return [];
    }

    const finalResponse = http.finalResponse;
    const evaluatedHeaders = finalResponse
      ? finalResponse.headers
      : http.headers;
    const evaluatedUrl = finalResponse?.url || http.finalUrl || http.url;

    if (evaluatedHeaders && evaluatedHeaders['referrer-policy']) {
      return [];
    }

    const confidence =
      http.confidence === 'AUTHORITATIVE' ? 'AUTHORITATIVE' : 'SUPPORTED';

    return [
      {
        ruleId: this.id,
        title: 'Missing Referrer-Policy Header',
        description: `The authoritative response (${evaluatedUrl}) does not specify an explicit Referrer-Policy header. User agents will default to browser privacy policies.`,
        category: FindingCategory.SECURITY_HEADER,
        severity: Severity.LOW,
        confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Referrer-Policy limits sensitive URL path data from leaking to third parties during external navigation.',
        whatThisDoesNotProve:
          'This observation does not establish that sensitive user parameters are currently leaking. It identifies the absence of an explicit referrer control policy.',
        recommendations: [
          {
            title: 'Configure Referrer-Policy',
            description:
              "Configure a Referrer-Policy header (such as 'strict-origin-when-cross-origin' or 'no-referrer') to control referrer leakage.",
          },
        ],
      },
    ];
  }
}
