import { Module } from '@nestjs/common';

import { FindingFactory } from './factories/finding.factory';
import { AtlasHealthRule } from './rules/infrastructure/atlas-health.rule';
import { FindingRuleEngineService } from './services/finding-rule-engine.service';
import { FindingRuleRegistryService } from './services/finding-rule-registry.service';
import { CertificateExpiryRule } from './rules/infrastructure/ssl/certificate-expiry.rule';

@Module({
  providers: [
    FindingRuleRegistryService,
    FindingRuleEngineService,
    FindingFactory,
    AtlasHealthRule,
    CertificateExpiryRule,
  ],
  exports: [
    FindingRuleRegistryService,
    FindingRuleEngineService,
    FindingFactory,
  ],
})
export class FindingsModule {}