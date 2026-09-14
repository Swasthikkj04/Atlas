import React from 'react';

interface SeverityTier {
  tier: string;
  label: string;
  remediationWindow: string;
  impactDescription: string;
  exampleFinding: string;
}

const SEVERITY_TIERS: SeverityTier[] = [
  {
    tier: 'CRITICAL',
    label: 'Critical Immediate Risk',
    remediationWindow: '< 24 Hours',
    impactDescription: 'Direct perimeter exposure, unauthenticated administrative access, or severe cryptographic failure.',
    exampleFinding: 'Direct Origin IP Bypasses Edge CDN Shielding & Exposes Internal Database',
  },
  {
    tier: 'HIGH',
    label: 'High Priority Gap',
    remediationWindow: '< 7 Days',
    impactDescription: 'Significant security posture deviation, deprecated protocol usage, or missing perimeter protection.',
    exampleFinding: 'TLS 1.0/1.1 Protocols Enabled on Public Ingress Gateway',
  },
  {
    tier: 'MEDIUM',
    label: 'Medium Posture Drift',
    remediationWindow: '< 30 Days',
    impactDescription: 'Moderate configuration weakness or suboptimal cryptographic transport parameters.',
    exampleFinding: 'Strict-Transport-Security (HSTS) Missing Preload Directive or Short Max-Age',
  },
  {
    tier: 'LOW',
    label: 'Low Hygiene Notice',
    remediationWindow: '< 90 Days',
    impactDescription: 'Minor information disclosure or non-critical perimeter hygiene notice.',
    exampleFinding: 'Server Header Discloses Detailed Reverse Proxy Version String',
  },
  {
    tier: 'INFORMATIONAL',
    label: 'Informational Attribution',
    remediationWindow: 'N/A',
    impactDescription: 'Neutral architectural observation or verified infrastructure attribution.',
    exampleFinding: 'Discovered Cloudflare Anycast CDN Routing with AS13335 Delegation',
  },
  {
    tier: 'POSITIVE',
    label: 'Positive Security Posture',
    remediationWindow: 'N/A',
    impactDescription: 'Proactive security posture compliance, modern protocol enforcement, and valid root trust.',
    exampleFinding: 'DNSSEC Cryptographic Chain of Trust Validated with Signed DS Record',
  },
];

export const SeverityTaxonomyVisualizer: React.FC = () => {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden my-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="p-3 font-medium">Severity Tier</th>
              <th className="p-3 font-medium">Remediation Window</th>
              <th className="p-3 font-medium">Impact Profile</th>
              <th className="p-3 font-medium">Canonical Example</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {SEVERITY_TIERS.map((tier) => (
              <tr key={tier.tier} className="hover:bg-muted/20 transition-colors">
                <td className="p-3 font-mono text-[11px] font-semibold text-foreground whitespace-nowrap">
                  {tier.tier}
                </td>
                <td className="p-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                  {tier.remediationWindow}
                </td>
                <td className="p-3 text-foreground/85 leading-relaxed">
                  {tier.impactDescription}
                </td>
                <td className="p-3 font-mono text-[11px] text-muted-foreground/90 leading-relaxed">
                  {tier.exampleFinding}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
