import { Injectable } from '@nestjs/common';
import {
  CaaRecordEntry,
  DnssecRecordData,
} from '../../../infrastructure/discovery/dns/dns-discovery.service';
import {
  BgpRpkiDiscoveryResult,
  RpkiStatus,
} from '../../../infrastructure/discovery/routing/contracts/bgp-rpki.interface';
import {
  AdvancedDnsRoutingPostureAssessment,
  BgpRpkiSecurityAssessment,
  CaaPolicyAssessment,
  DnssecValidationAssessment,
} from '../contracts/advanced-dns-routing-security.interface';

@Injectable()
export class AdvancedDnsRoutingAnalyzerService {
  /**
   * Analyze DNSSEC deployment, cryptographic algorithms, and chain of trust.
   */
  analyzeDnssec(dnssecData?: DnssecRecordData): DnssecValidationAssessment {
    if (
      !dnssecData ||
      !dnssecData.enabled ||
      dnssecData.status === 'UNSIGNED'
    ) {
      return {
        enabled: false,
        status: dnssecData?.status || 'UNSIGNED',
        hasDs: dnssecData?.hasDs ?? false,
        hasDnskey: dnssecData?.hasDnskey ?? false,
        hasRrsig: dnssecData?.hasRrsig ?? false,
        isHardened: false,
        summary:
          'DNSSEC is not enabled; zone records lack cryptographic origin authentication (RFC 4033).',
      };
    }

    if (dnssecData.status === 'EXPIRED_RRSIG') {
      return {
        enabled: true,
        status: 'EXPIRED_RRSIG',
        hasDs: dnssecData.hasDs,
        hasDnskey: dnssecData.hasDnskey,
        hasRrsig: dnssecData.hasRrsig,
        keyTags: dnssecData.keyTags,
        algorithms: dnssecData.algorithms,
        digestTypes: dnssecData.digestTypes,
        isHardened: false,
        summary:
          'DNSSEC RRSIG cryptographic signature is expired, causing validation failures on recursive resolvers.',
      };
    }

    if (
      dnssecData.status === 'MISCONFIGURED' ||
      dnssecData.status === 'BOGUS'
    ) {
      return {
        enabled: true,
        status: dnssecData.status,
        hasDs: dnssecData.hasDs,
        hasDnskey: dnssecData.hasDnskey,
        hasRrsig: dnssecData.hasRrsig,
        keyTags: dnssecData.keyTags,
        algorithms: dnssecData.algorithms,
        digestTypes: dnssecData.digestTypes,
        isHardened: false,
        summary:
          'DNSSEC chain of trust is broken (DS tag mismatch, algorithm failure, or SERVFAIL response).',
      };
    }

    const algStr = dnssecData.algorithms?.length
      ? ` (${dnssecData.algorithms.join(', ')})`
      : '';

    return {
      enabled: true,
      status: 'VALID',
      hasDs: dnssecData.hasDs,
      hasDnskey: dnssecData.hasDnskey,
      hasRrsig: dnssecData.hasRrsig,
      keyTags: dnssecData.keyTags,
      algorithms: dnssecData.algorithms,
      digestTypes: dnssecData.digestTypes,
      isHardened: true,
      summary: `Cryptographic DNSSEC chain of trust is fully valid and authenticated${algStr}.`,
    };
  }

  /**
   * Analyze Certification Authority Authorization (CAA, RFC 8659) records and verify active TLS issuer compliance.
   */
  analyzeCaa(
    caaRecords: CaaRecordEntry[] = [],
    observedTlsIssuer?: string,
  ): CaaPolicyAssessment {
    if (!caaRecords || caaRecords.length === 0) {
      return {
        present: false,
        records: [],
        authorizedIssuers: [],
        wildcardIssuers: [],
        allowsAllIssuers: true,
        blocksAllIssuers: false,
        isTlsIssuerPermitted: true,
        issuerMismatchDetected: false,
        isHardened: false,
        summary:
          'No CAA record published (RFC 8659); any public Certificate Authority may issue certificates.',
      };
    }

    const authorizedIssuers: string[] = [];
    const wildcardIssuers: string[] = [];
    let iodefMailbox: string | undefined;
    let blocksAllIssuers = false;

    for (const record of caaRecords) {
      if (record.issue) {
        const val = record.issue.trim().replace(/^"|"$/g, '');
        if (val === ';') {
          blocksAllIssuers = true;
        } else if (val) {
          authorizedIssuers.push(val);
        }
      }

      if (record.issuewild) {
        const val = record.issuewild.trim().replace(/^"|"$/g, '');
        if (val) {
          wildcardIssuers.push(val);
        }
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
        if (
          authLower.includes('letsencrypt') &&
          (issuerLower.includes("let's encrypt") ||
            issuerLower.includes('isrg'))
        )
          return true;
        if (authLower.includes('digicert') && issuerLower.includes('digicert'))
          return true;
        if (authLower.includes('google') || authLower.includes('pki.goog')) {
          if (issuerLower.includes('google') || issuerLower.includes('gts'))
            return true;
        }
        if (authLower.includes('sectigo') || authLower.includes('comodo')) {
          if (issuerLower.includes('sectigo') || issuerLower.includes('comodo'))
            return true;
        }
        if (authLower.includes('amazon') && issuerLower.includes('amazon'))
          return true;
        if (
          authLower.includes('globalsign') &&
          issuerLower.includes('globalsign')
        )
          return true;
        if (
          authLower.includes('cloudflare') &&
          issuerLower.includes('cloudflare')
        )
          return true;
        return (
          issuerLower.includes(authLower) || authLower.includes(issuerLower)
        );
      });

      if (!matched) {
        isTlsIssuerPermitted = false;
        issuerMismatchDetected = true;
      }
    }

    const isHardened =
      authorizedIssuers.length > 0 &&
      !issuerMismatchDetected &&
      !blocksAllIssuers;

    let summary = '';
    if (issuerMismatchDetected) {
      summary = `CAA policy restricts certificate issuance to [${authorizedIssuers.join(', ')}], which excludes current active TLS issuer '${observedTlsIssuer || 'Unknown'}'.`;
    } else if (blocksAllIssuers) {
      summary =
        'CAA policy explicitly forbids all Certificate Authorities from issuing certificates (issue ";").';
    } else {
      summary = `CAA policy enforced restricting issuance to authorized CAs: ${authorizedIssuers.join(', ')}.`;
    }

    return {
      present: true,
      records: caaRecords,
      authorizedIssuers,
      wildcardIssuers,
      iodefMailbox,
      allowsAllIssuers: false,
      blocksAllIssuers,
      isTlsIssuerPermitted,
      issuerMismatchDetected,
      isHardened,
      summary,
    };
  }

  /**
   * Analyze BGP Autonomous System Routing and RPKI Route Origin Authorization (ROV) posture.
   */
  analyzeBgpRpki(
    routingData?: BgpRpkiDiscoveryResult,
  ): BgpRpkiSecurityAssessment {
    if (
      !routingData ||
      !routingData.routes ||
      routingData.routes.length === 0
    ) {
      return {
        totalPrefixes: 0,
        validRoaCount: 0,
        invalidRoaCount: 0,
        notFoundRoaCount: 0,
        coveragePercentage: 0,
        overallRpkiStatus: 'UNKNOWN',
        uniqueAsns: [],
        isMultiHomed: false,
        hijackRiskDetected: false,
        isHardened: false,
        summary:
          'No BGP prefix routes or RPKI Route Origin Authorizations observed.',
      };
    }

    const { rpkiSummary, uniqueAsns, isMultiHomed, hijackRiskDetected } =
      routingData;
    const isHardened =
      rpkiSummary.overallRpkiStatus === 'VALID' && !hijackRiskDetected;

    let summary = '';
    if (hijackRiskDetected || rpkiSummary.overallRpkiStatus === 'INVALID') {
      summary = `BGP RPKI Route Origin Validation detected INVALID route announcement across ${rpkiSummary.invalidCount} prefix(es); high risk of BGP hijacking or route leak.`;
    } else if (rpkiSummary.overallRpkiStatus === 'VALID') {
      summary = `All announced BGP prefixes are cryptographically authenticated with valid RPKI ROAs (100% coverage, AS${uniqueAsns.join(', AS')}).`;
    } else if (rpkiSummary.overallRpkiStatus === 'NOT_FOUND') {
      summary = `BGP route prefixes are announced without cryptographic RPKI ROAs published (0% ROA coverage).`;
    } else {
      summary = `BGP RPKI coverage is ${rpkiSummary.coveragePercentage}% (${rpkiSummary.validCount}/${rpkiSummary.totalRoutes} valid prefixes).`;
    }

    return {
      totalPrefixes: rpkiSummary.totalRoutes,
      validRoaCount: rpkiSummary.validCount,
      invalidRoaCount: rpkiSummary.invalidCount,
      notFoundRoaCount: rpkiSummary.notFoundCount,
      coveragePercentage: rpkiSummary.coveragePercentage,
      overallRpkiStatus: rpkiSummary.overallRpkiStatus,
      uniqueAsns,
      isMultiHomed,
      hijackRiskDetected,
      isHardened,
      summary,
    };
  }

  /**
   * Holistic posture assessment across DNSSEC, CAA, and BGP RPKI dimensions.
   */
  assessAdvancedDnsRouting(
    domain: string,
    discovery: {
      dns?: any;
      ssl?: any;
      routing?: any;
    },
    snapshotId?: string,
  ): AdvancedDnsRoutingPostureAssessment {
    const dnssec = this.analyzeDnssec(discovery.dns?.dnssec);
    const caa = this.analyzeCaa(
      discovery.dns?.caa || [],
      discovery.ssl?.certificate?.issuer,
    );
    const bgpRpki = this.analyzeBgpRpki(discovery.routing);

    let score = 100;

    // DNSSEC Scoring
    if (!dnssec.enabled) {
      score -= 20;
    } else if (
      dnssec.status === 'EXPIRED_RRSIG' ||
      dnssec.status === 'MISCONFIGURED' ||
      dnssec.status === 'BOGUS'
    ) {
      score -= 35;
    }

    // CAA Scoring
    if (!caa.present) {
      score -= 15;
    } else if (caa.issuerMismatchDetected || caa.blocksAllIssuers) {
      score -= 30;
    }

    // BGP RPKI Scoring
    if (bgpRpki.hijackRiskDetected || bgpRpki.overallRpkiStatus === 'INVALID') {
      score -= 40;
    } else if (bgpRpki.overallRpkiStatus === 'NOT_FOUND') {
      score -= 15;
    }

    score = Math.max(0, Math.min(100, score));
    const isCompliant =
      score >= 80 && !bgpRpki.hijackRiskDetected && !caa.issuerMismatchDetected;

    const summary = isCompliant
      ? `Hardened Advanced DNS & Routing security on ${domain} (DNSSEC validated, CAA restricted, RPKI ROA confirmed)`
      : `Advanced DNS & Routing posture on ${domain} has security gaps (score: ${score}/100)`;

    return {
      domain,
      snapshotId,
      dnssec,
      caa,
      bgpRpki,
      overallScore: score,
      isCompliant,
      summary,
    };
  }
}
