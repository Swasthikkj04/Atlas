import { Injectable } from '@nestjs/common';
import { FindingCategory, FindingModule, Severity } from '@prisma/client';

import { FindingBuilder } from '../builder/finding.builder';
import { IntelligenceFinding } from '../contracts/intelligence-finding.interface';
import { RuleContext } from '../contracts/rule-context.interface';
import { AtlasRulePlugin, RuleMetadata } from '../contracts/rule-plugin.interface';

@Injectable()
export class HttpMissingHstsRule implements AtlasRulePlugin {
  readonly metadata: RuleMetadata = {
    id: 'http.missing-hsts',
    version: '1.0.0',
    name: 'Missing HSTS Header Rule',
    description: 'Detects absent Strict-Transport-Security security headers.',
    supportedObservations: ['strictTransportSecurity'],
  };

  evaluate(context: RuleContext): IntelligenceFinding | null {
    const obs = context.observations.strictTransportSecurity;
    if (!obs) {
      return null;
    }

    if (obs.observation.state === 'MISSING') {
      return new FindingBuilder()
        .setRule(this.metadata.id, this.metadata.version)
        .setModule(FindingModule.HTTP)
        .setCategory(FindingCategory.SECURITY_HEADER)
        .setSeverity(Severity.HIGH)
        .setTitle('Missing HSTS Header')
        .setDescription(
          'The application does not send the Strict-Transport-Security header. Browsers cannot enforce HTTPS for future requests.',
        )
        .addObservation('strictTransportSecurity', obs)
        .build();
    }

    if (obs.observation.state === 'UNKNOWN' || obs.observation.state === 'FAILED') {
      return new FindingBuilder()
        .setRule(this.metadata.id, this.metadata.version)
        .setModule(FindingModule.HTTP)
        .setCategory(FindingCategory.SECURITY_HEADER)
        .setSeverity(Severity.HIGH)
        .setTitle('HSTS Header Status Unknown')
        .setDescription(
          `HSTS header status could not be verified due to probe state (${obs.observation.state}).`,
        )
        .setState('UNKNOWN')
        .addObservation('strictTransportSecurity', obs)
        .build();
    }

    return null;
  }
}
