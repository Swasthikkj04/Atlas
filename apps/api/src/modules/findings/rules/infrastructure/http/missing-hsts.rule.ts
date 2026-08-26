import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingHstsRule implements FindingRule {
  readonly id = 'http.missing-hsts';

  readonly name = 'Missing HSTS Header';
  readonly category = FindingCategory.SECURITY_HEADER;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    // Invariant: NO_FAILED_LOOKUP_AS_HEADER_ABSENCE
    // Abort if HTTP discovery failed, timed out, or had network/DNS/SSL errors
    if (!http?.reachable || (http.queryStatus && http.queryStatus !== 'SUCCESS')) {
      return [];
    }

    // Invariant: HTTP_FINDING_REQUIRES_AUTHORITATIVE_RESPONSE
    // Evaluate the final authoritative response (or snapshot http baseline)
    const finalResponse = http.finalResponse;
    const isHttps = finalResponse ? finalResponse.isHttps : http.protocol === 'https';
    const evaluatedHeaders = finalResponse ? finalResponse.headers : http.headers;
    const evaluatedUrl = finalResponse?.url || http.finalUrl || http.url;

    // Invariant: HSTS_REQUIRES_HTTPS_CONTEXT
    // HSTS is only valid and enforceable over HTTPS (RFC 6797 § 8.1).
    // If the endpoint did not terminate on HTTPS, do not generate a missing HSTS finding.
    if (!isHttps) {
      return [];
    }

    // Invariant: NO_REDIRECT_RESPONSE_AS_FINAL_TRUTH
    // Check if HSTS is present on the final authoritative HTTPS response
    if (evaluatedHeaders && evaluatedHeaders['strict-transport-security']) {
      return [];
    }

    const confidence = http.confidence === 'AUTHORITATIVE' ? 'AUTHORITATIVE' : 'SUPPORTED';

    return [
      {
        ruleId: this.id,
        title: 'Missing HSTS Header',
        description: `The authoritative HTTPS endpoint (${evaluatedUrl}) does not advertise the Strict-Transport-Security header. Browsers cannot enforce HTTPS encryption for subsequent requests.`,
        category: FindingCategory.SECURITY_HEADER,
        severity: Severity.HIGH,
        confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'HSTS ensures user agents only interact with the domain over authenticated TLS channels, mitigating transport downgrade attacks.',
        whatThisDoesNotProve:
          'This observation does not establish that network traffic is currently being intercepted or downgraded. It identifies the absence of a proactive HTTPS enforcement header.',
        recommendations: [
          {
            title: 'Enable HSTS',
            description:
              'Configure the Strict-Transport-Security response header with an appropriate max-age and consider preload only after validation.',
          },
        ],
      },
    ];
  }
}
