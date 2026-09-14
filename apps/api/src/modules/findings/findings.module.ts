import { Module } from '@nestjs/common';

import { FindingFactory } from './factories/finding.factory';
import { FindingRuleEngineService } from './services/finding-rule-engine.service';
import { FindingRuleRegistryService } from './services/finding-rule-registry.service';

// Analyzers
import { HttpTransitAnalyzerService } from './services/http-transit-analyzer.service';
import { ContentSecurityAnalyzerService } from './services/content-security-analyzer.service';
import { CookieSecurityAnalyzerService } from './services/cookie-security-analyzer.service';
import { DataLeakageAnalyzerService } from './services/data-leakage-analyzer.service';
import { DnsSecurityAnalyzerService } from './services/dns-security-analyzer.service';
import { PerimeterExposureAnalyzerService } from './services/perimeter-exposure-analyzer.service';
import { TlsHygieneAnalyzerService } from './services/tls-hygiene-analyzer.service';
import { AdvancedDnsRoutingAnalyzerService } from './services/advanced-dns-routing-analyzer.service';

import * as Rules from './rules';

const ALL_RULES = [
  Rules.CertificateExpiryRule,
  Rules.SslUnsupportedRule,
  Rules.WeakTlsVersionRule,
  Rules.SelfSignedCertificateRule,
  Rules.SslEndpointUnreachableRule,
  Rules.SanCoverageMismatchRule,
  Rules.ModernTlsUpgradeOpportunityRule,
  Rules.MissingSpfRule,
  Rules.MissingDmarcRule,
  Rules.MissingMxRule,
  Rules.SingleNameserverRule,
  Rules.MissingIpv6Rule,
  Rules.SpfPermissivePolicyRule,
  Rules.DmarcPolicyHygieneRule,
  Rules.DnssecValidationRule,
  Rules.CaaPolicyComplianceRule,
  Rules.BgpRpkiValidationRule,
  Rules.DanglingCnameTakeoverRule,
  Rules.MissingHstsRule,
  Rules.HstsPolicyHygieneRule,
  Rules.MissingContentSecurityPolicyRule,
  Rules.CspPermissiveDirectivesRule,
  Rules.MissingXFrameOptionsRule,
  Rules.MissingXContentTypeOptionsRule,
  Rules.MissingReferrerPolicyRule,
  Rules.PermissionsPolicyHygieneRule,
  Rules.CrossOriginIsolationHygieneRule,
  Rules.SlowResponseRule,
  Rules.HttpServiceUnreachableRule,
  Rules.InsecureCorsPolicyRule,
  Rules.DangerousMethodsExposedRule,
  Rules.CleartextUpgradeMissingRule,
  Rules.AuthCookieHttpOnlyRule,
  Rules.AuthCookieSecureRule,
  Rules.AuthCookieSameSiteRule,
  Rules.DebugHeaderExposureRule,
  Rules.InternalTopologyLeakageRule,
  Rules.StackTraceDisclosureRule,
  Rules.EnvFileExposureRule,
  Rules.GitRepositoryExposureRule,
  Rules.ManagementEndpointExposureRule,
  Rules.TechnologyVersionExposureRule,
  Rules.DeprecatedGatewayVersionRule,
  Rules.MissingSecureIngressRule,
  Rules.EdgeOriginExposureRule,
  Rules.OriginIpBypassLeakageRule,
  Rules.InsecureIngressTransitRule,
  Rules.ClientIntegrationExposureRule,
  Rules.RuntimeDebugTraceExposureRule,
  Rules.ArchitectureDriftRiskRule,
];

const ALL_ANALYZERS = [
  HttpTransitAnalyzerService,
  ContentSecurityAnalyzerService,
  CookieSecurityAnalyzerService,
  DataLeakageAnalyzerService,
  DnsSecurityAnalyzerService,
  PerimeterExposureAnalyzerService,
  TlsHygieneAnalyzerService,
  AdvancedDnsRoutingAnalyzerService,
];

@Module({
  providers: [
    FindingRuleRegistryService,
    FindingRuleEngineService,
    FindingFactory,
    ...ALL_ANALYZERS,
    ...ALL_RULES,
  ],
  exports: [
    FindingRuleRegistryService,
    FindingRuleEngineService,
    FindingFactory,
    ...ALL_ANALYZERS,
    ...ALL_RULES,
  ],
})
export class FindingsModule {}
