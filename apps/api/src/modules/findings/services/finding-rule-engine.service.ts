import { Injectable, Logger } from '@nestjs/common';

import { FindingContext } from '../contracts/finding-context.interface';
import { FindingResult } from '../contracts/finding-result.interface';
import { FindingRuleRegistryService } from './finding-rule-registry.service';

@Injectable()
export class FindingRuleEngineService {
  private readonly logger = new Logger(
    FindingRuleEngineService.name,
  );

  constructor(
    private readonly registry: FindingRuleRegistryService,
  ) {}

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {
    const findings: FindingResult[] = [];

    const rules = this.registry.getRules();

    for (const rule of rules) {
      try {
        const results = await rule.evaluate(context);

        findings.push(...results);
      } catch (error) {
        this.logger.error(
          `Rule failed: ${rule.id}`,
          error instanceof Error
            ? error.stack
            : String(error),
        );

        continue;
      }
    }

    return findings;
  }
}