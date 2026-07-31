import { Module } from '@nestjs/common';

import { FindingFactory } from './factories/finding.factory';
import { AtlasHealthRule } from './rules/infrastructure/atlas-health.rule';
import { FindingRuleEngineService } from './services/finding-rule-engine.service';
import { FindingRuleRegistryService } from './services/finding-rule-registry.service';
import { CertificateExpiryRule } from './rules/infrastructure/ssl/certificate-expiry.rule';
import { SslUnsupportedRule } from './rules/infrastructure/ssl/ssl-not-supported.rule';
import { WeakTlsVersionRule } from './rules/infrastructure/ssl/weak-tls-version.rule';
import { SelfSignedCertificateRule } from './rules/infrastructure/ssl/self-signed-certificate.rule';
import { SslEndpointUnreachableRule } from './rules/infrastructure/ssl/ssl-endpoint-unreachable.rule';
import { MissingSpfRule } from './rules/infrastructure/dns/missing-spf.rule';
import { MissingDmarcRule } from './rules/infrastructure/dns/missing-dmarc.rules';
import { MissingMxRule } from './rules/infrastructure/dns/missing-mx.rules';
import { SingleNameserverRule } from './rules/infrastructure/dns/single-nameserver.rule';
import { MissingIpv6Rule } from './rules/infrastructure/dns/missing-ipv6.rule';
import { MissingHstsRule } from './rules/infrastructure/http/missing-hsts.rule';
import { MissingContentSecurityPolicyRule } from './rules/infrastructure/http/missing-content-security-policy.rule';
import { MissingXFrameOptionsRule } from './rules/infrastructure/http/missing-x-frame-options.rule';
import { MissingXContentTypeOptionsRule } from './rules/infrastructure/http/missing-x-content-type-options.rule';
import { MissingReferrerPolicyRule } from './rules/infrastructure/http/missing-referrer-policy.rule';
import { ServerHeaderExposedRule } from './rules/infrastructure/http/server-header-exposed.rule';
import { SlowResponseRule } from './rules/infrastructure/http/slow-response.rule';
import { HttpServiceUnreachableRule } from './rules/infrastructure/http/http-service-unreachable.rule';

@Module({
  providers: [
    FindingRuleRegistryService,
    FindingRuleEngineService,
    FindingFactory,
    AtlasHealthRule,
    CertificateExpiryRule,
    SslUnsupportedRule,
    WeakTlsVersionRule,
    SelfSignedCertificateRule,
    SslEndpointUnreachableRule,
    MissingSpfRule,
    MissingDmarcRule,
    MissingMxRule,
    SingleNameserverRule,
    MissingIpv6Rule,
    MissingHstsRule,
    MissingContentSecurityPolicyRule,
    MissingXFrameOptionsRule,
    MissingXContentTypeOptionsRule,
    MissingReferrerPolicyRule,
    ServerHeaderExposedRule,
    SlowResponseRule,
    HttpServiceUnreachableRule,
  ],
  exports: [
    FindingRuleRegistryService,
    FindingRuleEngineService,
    FindingFactory,
  ],
})
export class FindingsModule {}
