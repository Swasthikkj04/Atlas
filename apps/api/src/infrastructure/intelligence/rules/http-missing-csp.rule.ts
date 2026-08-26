import { Injectable } from '@nestjs/common';
import { FindingCategory, FindingModule, Severity } from '@prisma/client';

import { FindingBuilder } from '../builder/finding.builder';
import { IntelligenceFinding } from '../contracts/intelligence-finding.interface';
import { RuleContext } from '../contracts/rule-context.interface';
import {
  AtlasRulePlugin,
  RuleMetadata,
} from '../contracts/rule-plugin.interface';

@Injectable()
export class HttpMissingCspRule implements AtlasRulePlugin {
  readonly metadata: RuleMetadata = {
    id: 'http.missing-csp',
    version: '1.0.0',
    name: 'Missing Content Security Policy Rule',
    description: 'Detects absent Content-Security-Policy security headers.',
    supportedObservations: ['contentSecurityPolicy'],
  };

  evaluate(context: RuleContext): IntelligenceFinding | null {
    const obs = context.observations.contentSecurityPolicy;
    if (!obs) {
      return null;
    }

    // Invariant: NO_FAILED_LOOKUP_AS_HEADER_ABSENCE
    if (obs.observation.state === 'FAILED') {
      return null;
    }

    if (obs.observation.state === 'UNKNOWN') {
      return new FindingBuilder()
        .setRule(this.metadata.id, this.metadata.version)
        .setModule(FindingModule.HTTP)
        .setCategory(FindingCategory.SECURITY_HEADER)
        .setSeverity(Severity.LOW)
        .setTitle('CSP Header Status Unknown')
        .setDescription(
          `CSP header status could not be verified due to probe state (${obs.observation.state}).`,
        )
        .setState('UNKNOWN')
        .addObservation('contentSecurityPolicy', obs)
        .build();
    }

    if (obs.observation.state === 'MISSING') {
      return new FindingBuilder()
        .setRule(this.metadata.id, this.metadata.version)
        .setModule(FindingModule.HTTP)
        .setCategory(FindingCategory.SECURITY_HEADER)
        .setSeverity(Severity.HIGH)
        .setTitle('Missing Content Security Policy')
        .setDescription(
          'The application does not send a Content-Security-Policy header. This increases the risk of content injection and cross-site scripting attacks.',
        )
        .addObservation('contentSecurityPolicy', obs)
        .build();
    }

    return null;
  }
}
