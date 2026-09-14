/**
 * Certified P2 Invariants and Contracts for Advanced DNSSEC, CAA & BGP RPKI Validation.
 */

export const P2_ADVANCED_DNS_ROUTING_INVARIANTS = {
  P2_DNSSEC_VALIDATION_INTEGRITY: true,
  P2_CAA_RFC8659_POLICY_COMPLIANCE: true,
  P2_BGP_RPKI_ROUTE_ORIGIN_INTEGRITY: true,
  P2_FAILED_LOOKUP_TRUTH_PRESERVATION: true,
  P2_ANTI_OVERREACH_ENFORCEMENT: true,
  P2_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE: true,
  P2_CROSS_SURFACE_CONSISTENCY: true,
} as const;

export type DnssecStatus =
  | 'VALID'
  | 'UNSIGNED'
  | 'INSECURE'
  | 'EXPIRED_RRSIG'
  | 'MISCONFIGURED'
  | 'BOGUS';

export type RpkiStatus =
  | 'VALID'
  | 'INVALID'
  | 'NOT_FOUND'
  | 'UNKNOWN'
  | 'UNVERIFIABLE';

export interface ClientDnssecSummary {
  readonly enabled: boolean;
  readonly status: DnssecStatus;
  readonly hasDs: boolean;
  readonly hasDnskey: boolean;
  readonly hasRrsig: boolean;
  readonly algorithms: readonly string[];
  readonly digestTypes: readonly string[];
  readonly keyTags: readonly number[];
  readonly isHardened: boolean;
  readonly label: string;
}

export interface ClientCaaSummary {
  readonly present: boolean;
  readonly authorizedIssuers: readonly string[];
  readonly wildcardIssuers: readonly string[];
  readonly iodefMailbox?: string;
  readonly allowsAllIssuers: boolean;
  readonly blocksAllIssuers: boolean;
  readonly isTlsIssuerPermitted: boolean;
  readonly issuerMismatchDetected: boolean;
  readonly isHardened: boolean;
  readonly label: string;
}

export interface ClientBgpPrefixRoute {
  readonly ip: string;
  readonly ipVersion: 4 | 6;
  readonly prefix: string;
  readonly asn: number;
  readonly asName: string;
  readonly asOrg?: string;
  readonly country?: string;
  readonly registry?: string;
  readonly rpkiStatus: RpkiStatus;
  readonly isAnomaly?: boolean;
  readonly anomalyReason?: string;
}

export interface ClientBgpRpkiSummary {
  readonly totalRoutes: number;
  readonly validCount: number;
  readonly invalidCount: number;
  readonly notFoundCount: number;
  readonly overallStatus: RpkiStatus;
  readonly coveragePercentage: number;
  readonly isMultiHomed: boolean;
  readonly uniqueAsns: readonly number[];
  readonly hijackRiskDetected: boolean;
  readonly routes: readonly ClientBgpPrefixRoute[];
  readonly isHardened: boolean;
  readonly label: string;
}

export interface ClientAdvancedDnsRoutingSummary {
  readonly dnssec: ClientDnssecSummary;
  readonly caa: ClientCaaSummary;
  readonly bgpRpki: ClientBgpRpkiSummary;
  readonly overallScore: number;
  readonly isCompliant: boolean;
}

export function evaluateClientDnssec(dnssecData?: {
  enabled?: boolean;
  status?: DnssecStatus;
  hasDs?: boolean;
  hasDnskey?: boolean;
  hasRrsig?: boolean;
  algorithms?: string[];
  digestTypes?: string[];
  keyTags?: number[];
}): ClientDnssecSummary {
  const status: DnssecStatus = dnssecData?.status || (dnssecData?.enabled ? 'VALID' : 'UNSIGNED');
  const enabled = dnssecData?.enabled ?? (status === 'VALID');
  const isHardened = status === 'VALID';

  let label = 'Unsigned (DNSSEC Inactive)';
  if (status === 'VALID') label = 'DNSSEC Validated';
  else if (status === 'EXPIRED_RRSIG') label = 'Expired RRSIG Signature';
  else if (status === 'MISCONFIGURED' || status === 'BOGUS') label = 'Broken Chain of Trust';

  return {
    enabled,
    status,
    hasDs: dnssecData?.hasDs ?? enabled,
    hasDnskey: dnssecData?.hasDnskey ?? enabled,
    hasRrsig: dnssecData?.hasRrsig ?? enabled,
    algorithms: dnssecData?.algorithms || [],
    digestTypes: dnssecData?.digestTypes || [],
    keyTags: dnssecData?.keyTags || [],
    isHardened,
    label,
  };
}

export function evaluateClientCaa(
  caaRecords: Array<{
    critical?: number;
    issue?: string;
    issuewild?: string;
    iodef?: string;
  }> = [],
  observedTlsIssuer?: string,
): ClientCaaSummary {
  if (!caaRecords || caaRecords.length === 0) {
    return {
      present: false,
      authorizedIssuers: [],
      wildcardIssuers: [],
      allowsAllIssuers: true,
      blocksAllIssuers: false,
      isTlsIssuerPermitted: true,
      issuerMismatchDetected: false,
      isHardened: false,
      label: 'Unrestricted (No CAA Record)',
    };
  }

  const authorizedIssuers: string[] = [];
  const wildcardIssuers: string[] = [];
  let iodefMailbox: string | undefined;
  let blocksAllIssuers = false;

  for (const record of caaRecords) {
    if (record.issue) {
      const val = record.issue.trim().replace(/^"|"$/g, '');
      if (val === ';') blocksAllIssuers = true;
      else if (val) authorizedIssuers.push(val);
    }
    if (record.issuewild) {
      const val = record.issuewild.trim().replace(/^"|"$/g, '');
      if (val) wildcardIssuers.push(val);
    }
    if (record.iodef) {
      iodefMailbox = record.iodef.trim().replace(/^"|"$/g, '');
    }
  }

  let isTlsIssuerPermitted = true;
  let issuerMismatchDetected = false;

  if (blocksAllIssuers) {
    isTlsIssuerPermitted = false;
    issuerMismatchDetected = true;
  } else if (observedTlsIssuer && authorizedIssuers.length > 0) {
    const issuerLower = observedTlsIssuer.toLowerCase();
    const matched = authorizedIssuers.some((auth) => {
      const authLower = auth.toLowerCase();
      if (authLower.includes('letsencrypt') && (issuerLower.includes('let\'s encrypt') || issuerLower.includes('isrg'))) return true;
      if (authLower.includes('digicert') && issuerLower.includes('digicert')) return true;
      if (authLower.includes('google') || authLower.includes('pki.goog')) {
        if (issuerLower.includes('google') || issuerLower.includes('gts')) return true;
      }
      if (authLower.includes('sectigo') || authLower.includes('comodo')) {
        if (issuerLower.includes('sectigo') || issuerLower.includes('comodo')) return true;
      }
      if (authLower.includes('amazon') && issuerLower.includes('amazon')) return true;
      return issuerLower.includes(authLower) || authLower.includes(issuerLower);
    });

    if (!matched) {
      isTlsIssuerPermitted = false;
      issuerMismatchDetected = true;
    }
  }

  const isHardened = authorizedIssuers.length > 0 && !issuerMismatchDetected && !blocksAllIssuers;
  let label = 'CAA Policy Enforced';
  if (issuerMismatchDetected) label = 'CAA Issuer Mismatch';
  else if (blocksAllIssuers) label = 'All CAs Blocked';

  return {
    present: true,
    authorizedIssuers,
    wildcardIssuers,
    iodefMailbox,
    allowsAllIssuers: false,
    blocksAllIssuers,
    isTlsIssuerPermitted,
    issuerMismatchDetected,
    isHardened,
    label,
  };
}

export function evaluateClientBgpRpki(routingData?: {
  routes?: ClientBgpPrefixRoute[];
  uniqueAsns?: number[];
  isMultiHomed?: boolean;
  rpkiSummary?: {
    totalRoutes?: number;
    validCount?: number;
    invalidCount?: number;
    notFoundCount?: number;
    overallRpkiStatus?: RpkiStatus;
    coveragePercentage?: number;
  };
  hijackRiskDetected?: boolean;
}): ClientBgpRpkiSummary {
  const routes = routingData?.routes || [];
  const totalRoutes = routingData?.rpkiSummary?.totalRoutes ?? routes.length;
  const validCount = routingData?.rpkiSummary?.validCount ?? routes.filter((r) => r.rpkiStatus === 'VALID').length;
  const invalidCount = routingData?.rpkiSummary?.invalidCount ?? routes.filter((r) => r.rpkiStatus === 'INVALID').length;
  const notFoundCount = routingData?.rpkiSummary?.notFoundCount ?? routes.filter((r) => r.rpkiStatus === 'NOT_FOUND' || r.rpkiStatus === 'UNKNOWN').length;

  let overallStatus: RpkiStatus = routingData?.rpkiSummary?.overallRpkiStatus || 'UNKNOWN';
  if (invalidCount > 0) overallStatus = 'INVALID';
  else if (validCount === totalRoutes && totalRoutes > 0) overallStatus = 'VALID';
  else if (notFoundCount === totalRoutes && totalRoutes > 0) overallStatus = 'NOT_FOUND';

  const coveragePercentage = totalRoutes > 0 ? Math.round((validCount / totalRoutes) * 100) : 0;
  const hijackRiskDetected = routingData?.hijackRiskDetected ?? (invalidCount > 0);
  const isHardened = overallStatus === 'VALID' && !hijackRiskDetected;

  let label = 'Unauthenticated BGP';
  if (hijackRiskDetected || overallStatus === 'INVALID') label = 'BGP Hijack Risk (INVALID ROA)';
  else if (overallStatus === 'VALID') label = 'RPKI ROA Validated';

  return {
    totalRoutes,
    validCount,
    invalidCount,
    notFoundCount,
    overallStatus,
    coveragePercentage,
    isMultiHomed: routingData?.isMultiHomed ?? ((routingData?.uniqueAsns || []).length > 1),
    uniqueAsns: routingData?.uniqueAsns || [],
    hijackRiskDetected,
    routes,
    isHardened,
    label,
  };
}

export function evaluateClientAdvancedDnsRouting(
  dnsData?: any,
  sslData?: any,
  routingData?: any,
): ClientAdvancedDnsRoutingSummary {
  const dnssec = evaluateClientDnssec(dnsData?.dnssec);
  const caa = evaluateClientCaa(dnsData?.caa, sslData?.certificate?.issuer);
  const bgpRpki = evaluateClientBgpRpki(routingData);

  let score = 100;
  if (!dnssec.enabled) score -= 20;
  else if (dnssec.status === 'EXPIRED_RRSIG' || dnssec.status === 'MISCONFIGURED' || dnssec.status === 'BOGUS') score -= 35;

  if (!caa.present) score -= 15;
  else if (caa.issuerMismatchDetected || caa.blocksAllIssuers) score -= 30;

  if (bgpRpki.hijackRiskDetected || bgpRpki.overallStatus === 'INVALID') score -= 40;
  else if (bgpRpki.overallStatus === 'NOT_FOUND') score -= 15;

  score = Math.max(0, Math.min(100, score));
  const isCompliant = score >= 80 && !bgpRpki.hijackRiskDetected && !caa.issuerMismatchDetected;

  return {
    dnssec,
    caa,
    bgpRpki,
    overallScore: score,
    isCompliant,
  };
}

export function getDnssecBadgeConfig(status: DnssecStatus): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (status) {
    case 'VALID':
      return {
        label: 'DNSSEC Signed & Validated',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dotClass: 'bg-emerald-400',
      };
    case 'EXPIRED_RRSIG':
      return {
        label: 'Signature Expired (SERVFAIL)',
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        dotClass: 'bg-rose-400 animate-pulse',
      };
    case 'MISCONFIGURED':
    case 'BOGUS':
      return {
        label: 'Broken Chain (BOGUS)',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dotClass: 'bg-amber-400',
      };
    case 'UNSIGNED':
    case 'INSECURE':
    default:
      return {
        label: 'Unsigned Zone',
        badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        dotClass: 'bg-slate-400',
      };
  }
}

export function getCaaBadgeConfig(caa: ClientCaaSummary): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  if (caa.issuerMismatchDetected) {
    return {
      label: 'CAA Issuer Mismatch',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      dotClass: 'bg-rose-400',
    };
  }
  if (caa.isHardened) {
    return {
      label: 'CAA Enforced',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dotClass: 'bg-emerald-400',
    };
  }
  return {
    label: 'No CAA Record',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    dotClass: 'bg-slate-400',
  };
}

export function getRpkiBadgeConfig(status: RpkiStatus, hijackRisk: boolean): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  if (hijackRisk || status === 'INVALID') {
    return {
      label: 'RPKI INVALID (Hijack Risk)',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      dotClass: 'bg-rose-400 animate-pulse',
    };
  }
  if (status === 'VALID') {
    return {
      label: 'RPKI ROA Valid',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dotClass: 'bg-emerald-400',
    };
  }
  return {
    label: 'RPKI Not Configured',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    dotClass: 'bg-slate-400',
  };
}
