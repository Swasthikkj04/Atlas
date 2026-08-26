import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingXContentTypeOptionsRule implements FindingRule {
  readonly id = 'http.missing-x-content-type-options';

  readonly name = 'Missing X-Content-Type-Options Header';
  readonly category = FindingCategory.SECURITY_HEADER;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    if (!http?.reachable || (http.queryStatus && http.queryStatus !== 'SUCCESS')) {
      return [];
    }

    const finalResponse = http.finalResponse;
    const evaluatedHeaders = finalResponse ? finalResponse.headers : http.headers;
    const evaluatedUrl = finalResponse?.url || http.finalUrl || http.url;

    if (evaluatedHeaders && evaluatedHeaders['x-content-type-options']) {
      return [];
    }

    const confidence = http.confidence === 'AUTHORITATIVE' ? 'AUTHORITATIVE' : 'SUPPORTED';

    return [
      {
        ruleId: this.id,
        title: 'Missing X-Content-Type-Options Header',
        description: `The authoritative response (${evaluatedUrl}) does not specify 'X-Content-Type-Options: nosniff'. Browsers may attempt to MIME-sniff response bodies.`,
        category: FindingCategory.SECURITY_HEADER,
        severity: Severity.LOW,
        confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'X-Content-Type-Options prevents legacy MIME-sniffing behavior that could cause non-executable assets to be executed as scripts.',
        whatThisDoesNotProve:
          'This observation does not establish that untrusted user uploads are being executed. It identifies the absence of the MIME-sniffing prevention header.',
        recommendations: [
          {
            title: 'Enable X-Content-Type-Options',
            description:
              "Configure the 'X-Content-Type-Options: nosniff' header on all HTTP responses.",
          },
        ],
      },
    ];
  }
}
