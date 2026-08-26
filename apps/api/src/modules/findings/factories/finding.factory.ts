import { Injectable } from '@nestjs/common';

import { CreateFinding } from '../contracts/create-finding.interface';
import { FindingResult } from '../contracts/finding-result.interface';

@Injectable()
export class FindingFactory {
  create(input: CreateFinding): FindingResult {
    return {
      ruleId: input.ruleId,
      title: input.title,
      description: input.description,
      category: input.category,
      severity: input.severity,
      confidence: input.confidence ?? 'AUTHORITATIVE',
      riskClassification: input.riskClassification ?? 'SECURITY_HARDENING_GAP',
      severityRationale: input.severityRationale,
      whatThisDoesNotProve: input.whatThisDoesNotProve,
      recommendations: input.recommendations ?? [],
    };
  }
}
