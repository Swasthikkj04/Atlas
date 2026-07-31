import { Injectable } from '@nestjs/common';

import { FindingRule } from '../contracts/finding-rule.interface';
import { AtlasHealthRule } from '../rules/infrastructure/atlas-health.rule';
import { CertificateExpiryRule } from '../rules/infrastructure/ssl/certificate-expiry.rule';
import { SslUnsupportedRule } from '../rules/infrastructure/ssl/ssl-not-supported.rule';
import { WeakTlsVersionRule } from '../rules/infrastructure/ssl/weak-tls-version.rule';
import { SelfSignedCertificateRule } from '../rules/infrastructure/ssl/self-signed-certificate.rule';
import { SslEndpointUnreachableRule } from '../rules/infrastructure/ssl/ssl-endpoint-unreachable.rule';
import { MissingSpfRule } from '../rules/infrastructure/dns/missing-spf.rule';
import { MissingDmarcRule } from '../rules/infrastructure/dns/missing-dmarc.rules';
import { MissingMxRule } from '../rules/infrastructure/dns/missing-mx.rules';
import { SingleNameserverRule } from '../rules/infrastructure/dns/single-nameserver.rule';
import { MissingIpv6Rule } from '../rules/infrastructure/dns/missing-ipv6.rule';
import { MissingHstsRule } from '../rules/infrastructure/http/missing-hsts.rule';
import { MissingContentSecurityPolicyRule } from '../rules/infrastructure/http/missing-content-security-policy.rule';
import { MissingXFrameOptionsRule } from '../rules/infrastructure/http/missing-x-frame-options.rule';
import { MissingXContentTypeOptionsRule } from '../rules/infrastructure/http/missing-x-content-type-options.rule';
import { MissingReferrerPolicyRule } from '../rules/infrastructure/http/missing-referrer-policy.rule';
import { ServerHeaderExposedRule } from '../rules/infrastructure/http/server-header-exposed.rule';
import { SlowResponseRule } from '../rules/infrastructure/http/slow-response.rule';
import { HttpServiceUnreachableRule } from '../rules/infrastructure/http/http-service-unreachable.rule';

@Injectable()
export class FindingRuleRegistryService {
  constructor(
    private readonly atlasHealthRule: AtlasHealthRule,
    private readonly certificateExpiryRule: CertificateExpiryRule,
    private readonly sslUnsupportedRule: SslUnsupportedRule,
    private readonly weakTlsVersionRule: WeakTlsVersionRule,
    private readonly selfSignedCertificateRule: SelfSignedCertificateRule,
    private readonly sslEndpointUnreachableRule: SslEndpointUnreachableRule,
    private readonly missingSpfRule: MissingSpfRule,
    private readonly missingDmarcRule: MissingDmarcRule,
    private readonly missingMxRule: MissingMxRule,
    private readonly singleNameserverRule: SingleNameserverRule,
    private readonly missingIpv6Rule: MissingIpv6Rule,
    private readonly missingHstsRule: MissingHstsRule,
    private readonly missingContentSecurityPolicyRule: MissingContentSecurityPolicyRule,
    private readonly missingXFrameOptionsRule: MissingXFrameOptionsRule,
    private readonly missingXContentTypeOptionsRule: MissingXContentTypeOptionsRule,
    private readonly missingReferrerPolicyRule: MissingReferrerPolicyRule,
    private readonly serverHeaderExposedRule: ServerHeaderExposedRule,
    private readonly SlowResponseRule: SlowResponseRule,
    private readonly httpServiceUnreachableRule: HttpServiceUnreachableRule,
  ) {}

  private validateRules(rules: FindingRule[]): void {
    const ids = new Set<string>();

    for (const rule of rules) {
      if (!rule.id) {
        throw new Error('Finding rule missing id');
      }

      if (!rule.name) {
        throw new Error(`Finding rule ${rule.id} missing name`);
      }

      if (!rule.category) {
        throw new Error(`Finding rule ${rule.id} missing category`);
      }

      if (ids.has(rule.id)) {
        throw new Error(`Duplicate finding rule id: ${rule.id}`);
      }

      ids.add(rule.id);
    }
  }

  getRules(): FindingRule[] {
    const rules: FindingRule[] = [
      this.atlasHealthRule,
      this.certificateExpiryRule,
      this.sslUnsupportedRule,
      this.weakTlsVersionRule,
      this.selfSignedCertificateRule,
      this.sslEndpointUnreachableRule,
      this.missingSpfRule,
      this.missingDmarcRule,
      this.missingMxRule,
      this.singleNameserverRule,
      this.missingIpv6Rule,
      this.missingHstsRule,
      this.missingContentSecurityPolicyRule,
      this.missingXFrameOptionsRule,
      this.missingXContentTypeOptionsRule,
      this.missingReferrerPolicyRule,
      this.serverHeaderExposedRule,
      this.SlowResponseRule,
      this.httpServiceUnreachableRule,
    ];

    this.validateRules(rules);

    return rules;
  }
}
