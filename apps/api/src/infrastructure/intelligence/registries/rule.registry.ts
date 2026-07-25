import { Injectable, Logger } from '@nestjs/common';

import { IntelligenceFinding } from '../contracts/intelligence-finding.interface';
import { RuleDiagnostics } from '../contracts/rule-diagnostics.interface';
import { RuleContext } from '../contracts/rule-context.interface';
import { AtlasRulePlugin } from '../contracts/rule-plugin.interface';

export interface RuleEvaluationResultPackage {
  findings: IntelligenceFinding[];
  diagnostics: RuleDiagnostics;
}

@Injectable()
export class RuleRegistry {
  private readonly logger = new Logger(RuleRegistry.name);
  private readonly rules = new Map<string, AtlasRulePlugin>();

  register(rule: AtlasRulePlugin): void {
    if (this.rules.has(rule.metadata.id)) {
      throw new Error(`Rule with ID '${rule.metadata.id}' is already registered`);
    }

    this.rules.set(rule.metadata.id, rule);
    this.logger.log(
      `Registered Intelligence Rule: ${rule.metadata.name} (v${rule.metadata.version})`,
    );
  }

  evaluateAll(context: RuleContext): RuleEvaluationResultPackage {
    const startedAt = Date.now();
    const findings: IntelligenceFinding[] = [];
    let unknownStates = 0;
    let skippedRules = 0;

    for (const rule of this.rules.values()) {
      try {
        const finding = rule.evaluate(context);
        if (finding) {
          if (finding.state === 'UNKNOWN') {
            unknownStates++;
          }
          findings.push(finding);
        }
      } catch (err: any) {
        skippedRules++;
        this.logger.warn(
          `Rule '${rule.metadata.id}' evaluation failed: ${err.message}`,
        );
      }
    }

    const durationMs = Date.now() - startedAt;

    return {
      findings,
      diagnostics: {
        evaluatedRules: this.rules.size,
        matchedFindings: findings.filter((f) => f.state === 'MATCHED').length,
        unknownStates,
        skippedRules,
        executionDurationMs: durationMs,
      },
    };
  }

  getRule(id: string): AtlasRulePlugin | undefined {
    return this.rules.get(id);
  }

  getAllRules(): AtlasRulePlugin[] {
    return Array.from(this.rules.values());
  }
}
