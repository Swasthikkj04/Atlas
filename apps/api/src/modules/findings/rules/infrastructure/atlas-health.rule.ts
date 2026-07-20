import { Injectable } from '@nestjs/common';

import { FindingFactory } from '../../factories/finding.factory';
import { FindingContext } from '../../contracts/finding-context.interface';
import { FindingResult } from '../../contracts/finding-result.interface';
import { FindingRule } from '../../contracts/finding-rule.interface';
import { FindingCategory } from '../../enums/finding-category.enum';
import { Severity } from '../../enums/severity.enum';

@Injectable()
export class AtlasHealthRule implements FindingRule {
  readonly id = 'atlas-health';

  readonly name = 'Atlas Health';

  constructor(
    private readonly factory: FindingFactory,
  ) {}

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {

    return [
      this.factory.create({
        ruleId: this.id,
        title: 'Infrastructure processed',

        description:
          'Infrastructure snapshot processed successfully.',

        category: FindingCategory.GENERAL,

        severity: Severity.INFO,

        recommendations: [],
      }),
    ];
  }
}