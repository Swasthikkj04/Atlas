import { Injectable } from '@nestjs/common';

import { FindingRule } from '../contracts/finding-rule.interface';
import * as Rules from '../rules';
import { HttpTransitAnalyzerService } from './http-transit-analyzer.service';
import { ContentSecurityAnalyzerService } from './content-security-analyzer.service';
import { CookieSecurityAnalyzerService } from './cookie-security-analyzer.service';
import { DataLeakageAnalyzerService } from './data-leakage-analyzer.service';
import { DnsSecurityAnalyzerService } from './dns-security-analyzer.service';
import { PerimeterExposureAnalyzerService } from './perimeter-exposure-analyzer.service';
import { TlsHygieneAnalyzerService } from './tls-hygiene-analyzer.service';
import { AdvancedDnsRoutingAnalyzerService } from './advanced-dns-routing-analyzer.service';

@Injectable()
export class FindingRuleRegistryService {
  private readonly rulesMap = new Map<string, FindingRule>();

  constructor() {
    this.registerDefaults();
  }

  register(rule: FindingRule): void {
    if (!rule || !rule.id) return;
    this.rulesMap.set(rule.id, rule);
  }

  private registerDefaults(): void {
    const transitAnalyzer = new HttpTransitAnalyzerService();
    const contentAnalyzer = new ContentSecurityAnalyzerService();
    const cookieAnalyzer = new CookieSecurityAnalyzerService();
    const dataLeakageAnalyzer = new DataLeakageAnalyzerService();
    const dnsAnalyzer = new DnsSecurityAnalyzerService();
    const perimeterAnalyzer = new PerimeterExposureAnalyzerService();
    const tlsAnalyzer = new TlsHygieneAnalyzerService();
    const advDnsAnalyzer = new AdvancedDnsRoutingAnalyzerService();

    const defaults: (FindingRule | undefined)[] = [
      new Rules.CertificateExpiryRule(),
      new Rules.SslUnsupportedRule(),
      new Rules.WeakTlsVersionRule(),
      new Rules.SelfSignedCertificateRule(),
      new Rules.SslEndpointUnreachableRule(),
      new Rules.MissingSpfRule(),
      new Rules.MissingDmarcRule(),
      new Rules.MissingMxRule(),
      new Rules.SingleNameserverRule(),
      new Rules.MissingIpv6Rule(),
      new Rules.MissingHstsRule(),
      new Rules.MissingContentSecurityPolicyRule(),
      new Rules.MissingXFrameOptionsRule(),
      new Rules.MissingXContentTypeOptionsRule(),
      new Rules.MissingReferrerPolicyRule(),
      new Rules.SlowResponseRule(),
      new Rules.HttpServiceUnreachableRule(),

      // HTTP Transit
      new Rules.InsecureCorsPolicyRule(transitAnalyzer),
      new Rules.DangerousMethodsExposedRule(transitAnalyzer),
      new Rules.CleartextUpgradeMissingRule(transitAnalyzer),

      // Perimeter & Configuration Exposure
      new Rules.EnvFileExposureRule(perimeterAnalyzer),
      new Rules.GitRepositoryExposureRule(perimeterAnalyzer),
      new Rules.ManagementEndpointExposureRule(perimeterAnalyzer),

      // Data Leakage & Debug Exposure
      new Rules.DebugHeaderExposureRule(dataLeakageAnalyzer),
      new Rules.InternalTopologyLeakageRule(dataLeakageAnalyzer),
      new Rules.StackTraceDisclosureRule(dataLeakageAnalyzer),

      // Content Security
      new Rules.CspPermissiveDirectivesRule(contentAnalyzer),
      new Rules.PermissionsPolicyHygieneRule(contentAnalyzer),
      new Rules.CrossOriginIsolationHygieneRule(contentAnalyzer),

      // Cookie Security
      new Rules.AuthCookieHttpOnlyRule(cookieAnalyzer),
      new Rules.AuthCookieSecureRule(cookieAnalyzer),
      new Rules.AuthCookieSameSiteRule(cookieAnalyzer),

      // DNS Security & Routing
      new Rules.SpfPermissivePolicyRule(dnsAnalyzer),
      new Rules.DmarcPolicyHygieneRule(dnsAnalyzer),
      new Rules.DanglingCnameTakeoverRule(dnsAnalyzer),
      new Rules.DnssecValidationRule(advDnsAnalyzer),
      new Rules.CaaPolicyComplianceRule(advDnsAnalyzer),
      new Rules.BgpRpkiValidationRule(advDnsAnalyzer),

      // TLS Hygiene
      new Rules.SanCoverageMismatchRule(tlsAnalyzer),
      new Rules.ModernTlsUpgradeOpportunityRule(tlsAnalyzer),
      new Rules.HstsPolicyHygieneRule(tlsAnalyzer),

      // Technology Finding Rules
      new Rules.TechnologyVersionExposureRule(),
      new Rules.DeprecatedGatewayVersionRule(),
      new Rules.MissingSecureIngressRule(),
      new Rules.EdgeOriginExposureRule(),
      new Rules.OriginIpBypassLeakageRule(),
      new Rules.InsecureIngressTransitRule(),
      new Rules.ClientIntegrationExposureRule(),
      new Rules.RuntimeDebugTraceExposureRule(),
      new Rules.ArchitectureDriftRiskRule(),
    ];

    for (const r of defaults) {
      if (r && r.id) {
        this.rulesMap.set(r.id, r);
      }
    }
  }

  getRules(): FindingRule[] {
    return Array.from(this.rulesMap.values());
  }
}
