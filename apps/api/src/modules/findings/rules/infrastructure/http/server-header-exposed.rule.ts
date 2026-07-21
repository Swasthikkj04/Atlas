import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class ServerHeaderExposedRule implements FindingRule {
  readonly id = 'http.server-header-exposed';

  readonly name = 'Server Header Exposed';

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    if (!http?.reachable) {
      return [];
    }

    const server = http.headers['server'];

    if (!server) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'Server Header Exposed',
        description: `The server identifies itself as "${server}" through the HTTP Server header.`,
        category: FindingCategory.RESPONSE,
        severity: Severity.INFO,
        recommendations: [
          {
            title: 'Reduce server information disclosure',
            description:
              'Consider suppressing or minimizing the Server response header to reduce unnecessary infrastructure disclosure.',
          },
        ],
      },
    ];
  }
}