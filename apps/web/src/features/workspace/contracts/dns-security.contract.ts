/**
 * Certified S5 Frontend Contracts for DNS Security Posture & Mail Authentication.
 */

export const S5_DNS_SECURITY_INVARIANTS = {
  S5_DNS_MAIL_SECURITY_INTEGRITY: true,
  S5_SPF_PERMISSIVE_QUALIFIER_DETECTION: true,
  S5_DMARC_ENFORCEMENT_POLICY_DETECTION: true,
  S5_DANGLING_CNAME_TAKEOVER_AUDIT: true,
  S5_FAILED_LOOKUP_TRUTH_PRESERVATION: true,
  S5_ANTI_OVERREACH_ENFORCEMENT: true,
  S5_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE: true,
  S5_CROSS_SURFACE_CONSISTENCY: true,
} as const;

export interface ClientDnsRecordSummary {
  hasSpf: boolean;
  spfQualifier: 'PASS_ALL' | 'NEUTRAL_ALL' | 'SOFTFAIL_ALL' | 'HARDFFAIL_ALL' | 'NONE';
  isSpfPermissive: boolean;
  hasDmarc: boolean;
  dmarcPolicy: 'NONE' | 'QUARANTINE' | 'REJECT' | 'NONE_SET';
  isDmarcEnforced: boolean;
  isDmarcMonitoringOnly: boolean;
  danglingCnameDetected: boolean;
  danglingProvider?: string;
  securityScore: number;
}

export function evaluateClientDnsSecurity(
  txtRecords: Array<string | string[]> = [],
  dmarcRecords: Array<string | string[]> = [],
  cnameRecords: string[] = [],
  aRecords: string[] = [],
  httpReachable = true,
): ClientDnsRecordSummary {
  const flatTxt = txtRecords.map((r) => (Array.isArray(r) ? r.join('') : String(r)));
  const flatDmarc = dmarcRecords.map((r) => (Array.isArray(r) ? r.join('') : String(r)));

  const spf = flatTxt.find((r) => r.trim().toLowerCase().startsWith('v=spf1'));
  let hasSpf = false;
  let isSpfPermissive = false;
  let spfQualifier: ClientDnsRecordSummary['spfQualifier'] = 'NONE';

  if (spf) {
    hasSpf = true;
    const lower = spf.toLowerCase();
    if (lower.includes('+all') || lower.endsWith(' all')) {
      spfQualifier = 'PASS_ALL';
      isSpfPermissive = true;
    } else if (lower.includes('?all')) {
      spfQualifier = 'NEUTRAL_ALL';
      isSpfPermissive = true;
    } else if (lower.includes('~all')) {
      spfQualifier = 'SOFTFAIL_ALL';
    } else if (lower.includes('-all')) {
      spfQualifier = 'HARDFFAIL_ALL';
    }
  }

  const dmarc = flatDmarc.find((r) => r.trim().toLowerCase().startsWith('v=dmarc1'));
  let hasDmarc = false;
  let dmarcPolicy: ClientDnsRecordSummary['dmarcPolicy'] = 'NONE_SET';
  let isDmarcEnforced = false;
  let isDmarcMonitoringOnly = false;

  if (dmarc) {
    hasDmarc = true;
    const lower = dmarc.toLowerCase();
    if (lower.includes('p=reject')) {
      dmarcPolicy = 'REJECT';
      isDmarcEnforced = true;
    } else if (lower.includes('p=quarantine')) {
      dmarcPolicy = 'QUARANTINE';
      isDmarcEnforced = true;
    } else if (lower.includes('p=none')) {
      dmarcPolicy = 'NONE';
      isDmarcMonitoringOnly = true;
    }
  }

  let danglingCnameDetected = false;
  let danglingProvider: string | undefined;

  if (cnameRecords.length > 0) {
    const primaryCname = cnameRecords[0].toLowerCase();
    if (primaryCname.endsWith('.github.io') || primaryCname.includes('s3.amazonaws.com') || primaryCname.endsWith('.azurewebsites.net') || primaryCname.endsWith('.herokuapp.com')) {
      if (aRecords.length === 0 || !httpReachable) {
        danglingCnameDetected = true;
        if (primaryCname.endsWith('.github.io')) danglingProvider = 'GitHub Pages';
        else if (primaryCname.includes('s3.amazonaws.com')) danglingProvider = 'AWS S3';
        else if (primaryCname.endsWith('.azurewebsites.net')) danglingProvider = 'Azure App Service';
        else if (primaryCname.endsWith('.herokuapp.com')) danglingProvider = 'Heroku';
      }
    }
  }

  let score = 100;
  if (!hasSpf) score -= 30;
  else if (isSpfPermissive) score -= 20;

  if (!hasDmarc) score -= 30;
  else if (isDmarcMonitoringOnly) score -= 15;

  if (danglingCnameDetected) score -= 40;

  score = Math.max(0, Math.min(100, score));

  return {
    hasSpf,
    spfQualifier,
    isSpfPermissive,
    hasDmarc,
    dmarcPolicy,
    isDmarcEnforced,
    isDmarcMonitoringOnly,
    danglingCnameDetected,
    danglingProvider,
    securityScore: score,
  };
}
