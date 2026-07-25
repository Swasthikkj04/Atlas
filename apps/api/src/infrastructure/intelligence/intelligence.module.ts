import { Module, OnModuleInit } from '@nestjs/common';

import { RuleRegistry } from './registries/rule.registry';
import { HttpMissingCspRule } from './rules/http-missing-csp.rule';
import { HttpMissingHstsRule } from './rules/http-missing-hsts.rule';
import { IntelligenceEngineService } from './services/intelligence-engine.service';

@Module({
  providers: [
    RuleRegistry,
    IntelligenceEngineService,
    HttpMissingHstsRule,
    HttpMissingCspRule,
  ],
  exports: [
    RuleRegistry,
    IntelligenceEngineService,
    HttpMissingHstsRule,
    HttpMissingCspRule,
  ],
})
export class IntelligenceModule implements OnModuleInit {
  constructor(
    private readonly ruleRegistry: RuleRegistry,
    private readonly httpMissingHstsRule: HttpMissingHstsRule,
    private readonly httpMissingCspRule: HttpMissingCspRule,
  ) {}

  onModuleInit() {
    this.ruleRegistry.register(this.httpMissingHstsRule);
    this.ruleRegistry.register(this.httpMissingCspRule);
  }
}
