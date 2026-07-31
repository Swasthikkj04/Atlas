import { Injectable } from '@nestjs/common';

import { NormalizationResult } from '../../normalization/contracts/normalization-result.interface';
import {
  RuleEvaluationResultPackage,
  RuleRegistry,
} from '../registries/rule.registry';

@Injectable()
export class IntelligenceEngineService {
  constructor(private readonly ruleRegistry: RuleRegistry) {}

  evaluateKnowledge(
    normalizationResult: NormalizationResult<any>,
  ): RuleEvaluationResultPackage {
    return this.ruleRegistry.evaluateAll({
      domainId: normalizationResult.domainId,
      observations: normalizationResult.observations,
    });
  }
}
