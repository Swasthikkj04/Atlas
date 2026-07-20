import { Injectable } from '@nestjs/common';

import { FindingRule } from '../contracts/finding-rule.interface';
import { AtlasHealthRule } from '../rules/infrastructure/atlas-health.rule';
import { CertificateExpiryRule } from '../rules/infrastructure/ssl/certificate-expiry.rule';

@Injectable()
export class FindingRuleRegistryService {
  constructor(
    private readonly atlasHealthRule: AtlasHealthRule,
    private readonly certificateExpiryRule: CertificateExpiryRule,
  ) {}

  getRules(): FindingRule[] {
    return [
      this.atlasHealthRule,
      this.certificateExpiryRule,
    ];
  }
}