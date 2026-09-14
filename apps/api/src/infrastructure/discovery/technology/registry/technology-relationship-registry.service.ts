import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import {
  TechnologyRelationshipRule,
  TopologyNode,
  TechnologyRelationship,
  TechnologyDetectionContext,
} from '../contracts';
import * as AllRules from '../rules';

@Injectable()
export class TechnologyRelationshipRegistryService implements OnModuleInit {
  private readonly logger = new Logger(
    TechnologyRelationshipRegistryService.name,
  );
  private readonly rules = new Map<string, TechnologyRelationshipRule>();

  constructor(@Optional() defaultRules?: TechnologyRelationshipRule[]) {
    if (Array.isArray(defaultRules)) {
      for (const rule of defaultRules) {
        this.register(rule);
      }
    }
  }

  onModuleInit(): void {
    if (this.rules.size === 0) {
      this.registerDefaults();
    }
  }

  registerDefaults(): void {
    for (const RuleClass of Object.values(AllRules)) {
      if (typeof RuleClass === 'function') {
        try {
          const instance = new (RuleClass as any)();
          if (
            instance &&
            instance.id &&
            instance.name &&
            typeof instance.evaluate === 'function' &&
            !this.rules.has(instance.id)
          ) {
            this.register(instance);
          }
        } catch {
          // ignore non-constructable exports
        }
      }
    }
  }

  register(rule: TechnologyRelationshipRule): void {
    if (!rule || typeof rule !== 'object') {
      throw new Error('Technology relationship rule must be a valid object');
    }

    if (!rule.id || typeof rule.id !== 'string' || rule.id.trim() === '') {
      throw new Error(
        'Technology relationship rule must have a valid non-empty id',
      );
    }

    if (
      !rule.name ||
      typeof rule.name !== 'string' ||
      rule.name.trim() === ''
    ) {
      throw new Error(`Technology relationship rule '${rule.id}' missing name`);
    }

    if (typeof rule.evaluate !== 'function') {
      throw new Error(
        `Technology relationship rule '${rule.id}' missing evaluate method`,
      );
    }

    if (this.rules.has(rule.id)) {
      throw new Error(
        `Technology relationship rule with ID '${rule.id}' is already registered`,
      );
    }

    this.rules.set(rule.id, rule);
    this.logger.debug(
      `Registered technology relationship rule: ${rule.name} [${rule.id}]`,
    );
  }

  unregister(ruleId: string): boolean {
    const exists = this.rules.has(ruleId);
    if (exists) {
      this.rules.delete(ruleId);
      this.logger.debug(`Unregistered technology relationship rule: ${ruleId}`);
      return true;
    }
    return false;
  }

  get(ruleId: string): TechnologyRelationshipRule | undefined {
    return this.rules.get(ruleId);
  }

  has(ruleId: string): boolean {
    return this.rules.has(ruleId);
  }

  list(): TechnologyRelationshipRule[] {
    return Array.from(this.rules.values());
  }

  clear(): void {
    this.rules.clear();
  }

  async evaluateAll(
    nodes: TopologyNode[],
    context: TechnologyDetectionContext,
  ): Promise<TechnologyRelationship[]> {
    const allRelationships: TechnologyRelationship[] = [];
    const allRules = this.list();

    for (const rule of allRules) {
      try {
        const results = await rule.evaluate(nodes, context);
        if (Array.isArray(results)) {
          allRelationships.push(...results);
        }
      } catch (error) {
        this.logger.error(
          `Technology relationship rule '${rule.id}' failed during evaluation:`,
          error instanceof Error ? error.stack : String(error),
        );
        continue;
      }
    }

    return allRelationships;
  }
}
