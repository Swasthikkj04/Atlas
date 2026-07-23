import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

const SLOW_RESPONSE_THRESHOLD_MS = 2000;

@Injectable()
export class SlowResponseRule implements FindingRule {
  readonly id = 'http.slow-response';

  readonly name = 'Slow HTTP Response';
  readonly category = FindingCategory.SECURITY_HEADER;

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    if (!http?.reachable) {
      return [];
    }

    if (http.responseTimeMs < SLOW_RESPONSE_THRESHOLD_MS) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'Slow HTTP Response',
        description: `The endpoint responded in ${http.responseTimeMs} ms, exceeding the ${SLOW_RESPONSE_THRESHOLD_MS} ms threshold.`,
        category: FindingCategory.PERFORMANCE,
        severity: Severity.LOW,
        recommendations: [
          {
            title: 'Investigate response time',
            description:
              'Review application performance, database queries, caching, and network latency to reduce response times.',
          },
        ],
      },
    ];
  }
}