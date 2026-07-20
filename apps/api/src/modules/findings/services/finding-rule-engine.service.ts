import { Injectable } from '@nestjs/common';

import { FindingContext } from '../contracts/finding-context.interface';
import { FindingResult } from '../contracts/finding-result.interface';
import { FindingRuleRegistryService } from './finding-rule-registry.service';

@Injectable()
export class FindingRuleEngineService {
  constructor(
    private readonly registry: FindingRuleRegistryService,
  ) {}

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {
    const findings: FindingResult[] = [];

    const rules = this.registry.getRules();

    for (const rule of rules) {
      const results = await rule.evaluate(context);

      findings.push(...results);
    }

    return findings;
  }
}