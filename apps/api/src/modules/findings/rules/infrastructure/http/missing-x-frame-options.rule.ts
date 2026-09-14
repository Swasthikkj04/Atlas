import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingXFrameOptionsRule implements FindingRule {
  readonly id = 'http.missing-x-frame-options';

  readonly name = 'Missing X-Frame-Options Header';
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

    if (evaluatedHeaders && evaluatedHeaders['x-frame-options']) {
      return [];
    }

    const confidence =
      http.confidence === 'AUTHORITATIVE' ? 'AUTHORITATIVE' : 'SUPPORTED';

    return [
      {
        ruleId: this.id,
        title: 'Missing X-Frame-Options Header',
        description: `The authoritative response (${evaluatedUrl}) does not send an X-Frame-Options or equivalent frame-ancestors directive. This may allow pages to be framed in third-party contexts.`,
        category: FindingCategory.SECURITY_HEADER,
        severity: Severity.MEDIUM,
        confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Framing controls prevent malicious sites from rendering the application inside hidden frames to execute clickjacking attacks.',
        whatThisDoesNotProve:
          'This observation does not prove that the site is actively being framed or vulnerable to successful clickjacking. It identifies the absence of explicit framing restrictions.',
        recommendations: [
          {
            title: 'Configure X-Frame-Options',
            description:
              'Configure the X-Frame-Options response header with DENY or SAMEORIGIN, or specify frame-ancestors in Content-Security-Policy.',
          },
        ],
      },
    ];
  }
}
