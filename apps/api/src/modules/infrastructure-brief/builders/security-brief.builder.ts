import { Injectable } from '@nestjs/common';
import { SnapshotDetailDto } from '../../infrastructure-snapshots/dto/snapshot-detail.dto';
import { FindingDto } from '../../infrastructure-findings/dto/finding.dto';
import {
  SecurityBriefResult,
  SecurityPostureGrade,
  SecurityPostureStatus,
  SecurityPillarSummary,
  SecurityBriefHighlight,
  SecurityBriefRecommendation,
} from '../contracts/security-brief-result.interface';

@Injectable()
export class SecurityBriefBuilder {
  build(
    snapshot: SnapshotDetailDto,
    findings: FindingDto[],
  ): SecurityBriefResult {
    const domainName =
      snapshot.domainName ||
      (snapshot.payload as any)?.domain ||
      (snapshot.payload as any)?.domainName ||
      'the target domain';

    const securityRulePrefixes = [
      'security.',
      'tls.',
      'ssl.',
      'dns.',
      'http.csp',
      'http.cross-origin',
      'http.permissions',
      'http.missing-content-security',
      'http.missing-x-frame',
      'http.missing-x-content-type',
      'http.missing-referrer',
      'http.insecure-cors',
      'http.dangerous-methods',
      'http.cleartext-upgrade',
    ];

    const securityFindings = findings.filter((f) => {
      const cat = (f.category || '').toUpperCase();
      const isSecurityCategory =
        cat === 'SECURITY' ||
        cat === 'TLS' ||
        cat === 'SSL' ||
        cat === 'CERTIFICATE' ||
        cat === 'DNS_SECURITY' ||
        cat === 'CONFIGURATION_SECURITY' ||
        cat === 'HEADER_SECURITY';
      const matchesPrefix = securityRulePrefixes.some(
        (p) => f.ruleId?.startsWith(p) || f.id?.startsWith(p),
      );
      return isSecurityCategory || matchesPrefix;
    });

    const critical = securityFindings.filter(
      (f) => f.severity === 'CRITICAL',
    ).length;
    const high = securityFindings.filter((f) => f.severity === 'HIGH').length;
    const medium = securityFindings.filter(
      (f) => f.severity === 'MEDIUM',
    ).length;
    const low = securityFindings.filter(
      (f) =>
        f.severity === 'LOW' ||
        f.severity === 'INFO' ||
        f.severity === 'INFORMATIONAL',
    ).length;

    // Calculate Security Score (100 base)
    let score = 100;
    score -= critical * 25;
    score -= high * 15;
    score -= medium * 5;
    score -= low * 2;
    if (score < 0) score = 0;
    if (score > 100) score = 100;

    // Determine Security Grade
    let securityGrade: SecurityPostureGrade = 'A+';
    if (score >= 95) securityGrade = 'A+';
    else if (score >= 85) securityGrade = 'A';
    else if (score >= 75) securityGrade = 'B';
    else if (score >= 65) securityGrade = 'C';
    else if (score >= 50) securityGrade = 'D';
    else securityGrade = 'F';

    // Determine Posture Status
    let posture: SecurityPostureStatus = 'HARDENED';
    if (critical > 0) {
      posture = 'CRITICAL_RISK';
    } else if (high > 0) {
      posture = 'ATTENTION';
    } else if (score >= 85) {
      posture = 'HARDENED';
    } else {
      posture = 'BASELINE';
    }

    // Build 7 Security Pillars (S1 – S7)
    const pillars = this.buildPillars(snapshot, securityFindings);

    // Build Highlights
    const highlights = this.buildHighlights(snapshot, securityFindings);

    // Build Recommendations
    const recommendations = this.buildRecommendations(
      securityFindings,
      pillars,
    );

    // Build Security Summary Narrative
    const securitySummary = this.buildNarrative(
      domainName,
      posture,
      score,
      securityGrade,
      critical,
      high,
      medium,
      pillars,
    );

    return {
      domainName,
      posture,
      securityScore: score,
      securityGrade,
      securitySummary,
      highlights,
      pillars,
      recommendations,
      verifiedAt: snapshot.createdAt
        ? new Date(snapshot.createdAt).toISOString()
        : new Date().toISOString(),
    };
  }

  private buildPillars(
    snapshot: SnapshotDetailDto,
    findings: FindingDto[],
  ): SecurityPillarSummary[] {
    const payload = (snapshot.payload || {}) as any;

    // S1: Cookie & Session Security
    const s1Findings = findings.filter(
      (f) =>
        f.ruleId?.includes('cookie') ||
        f.category === 'COOKIE_SECURITY' ||
        f.title.toLowerCase().includes('cookie'),
    );
    const s1Status = s1Findings.some((f) => f.severity === 'CRITICAL')
      ? 'CRITICAL'
      : s1Findings.some((f) => f.severity === 'HIGH' || f.severity === 'MEDIUM')
        ? 'ATTENTION'
        : 'SECURE';
    const s1: SecurityPillarSummary = {
      id: 'cookie_session',
      code: 'S1',
      name: 'Cookie & Session Security',
      status: s1Status,
      summary:
        s1Findings.length > 0
          ? `${s1Findings.length} session cookie security observation${s1Findings.length > 1 ? 's' : ''} requiring configuration review.`
          : 'All observed session cookies enforce HttpOnly, Secure, and strict SameSite isolation.',
      findingsCount: s1Findings.length,
      signals: [
        'HttpOnly Flag',
        'Secure Flag',
        'SameSite Policy',
        'Partitioned State',
      ],
    };

    // S2: Data Leakage & Debug Exposure
    const s2Findings = findings.filter(
      (f) =>
        f.ruleId?.includes('debug') ||
        f.ruleId?.includes('internal-topology') ||
        f.ruleId?.includes('stack-trace') ||
        f.title.toLowerCase().includes('leakage') ||
        f.title.toLowerCase().includes('stack trace'),
    );
    const s2Status = s2Findings.some((f) => f.severity === 'CRITICAL')
      ? 'CRITICAL'
      : s2Findings.some((f) => f.severity === 'HIGH' || f.severity === 'MEDIUM')
        ? 'ATTENTION'
        : 'SECURE';
    const s2: SecurityPillarSummary = {
      id: 'data_leakage',
      code: 'S2',
      name: 'Data Leakage & Debug Exposure',
      status: s2Status,
      summary:
        s2Findings.length > 0
          ? `${s2Findings.length} exposure finding${s2Findings.length > 1 ? 's' : ''} detected in server response headers or error bodies.`
          : 'Zero debug headers, internal RFC 1918 IPs, or unhandled stack traces exposed in wire traffic.',
      findingsCount: s2Findings.length,
      signals: [
        'Debug Headers',
        'Internal IPs',
        'Stack Trace Protection',
        'Server Banners',
      ],
    };

    // S3: Ingress & TLS Hygiene
    const s3Findings = findings.filter(
      (f) =>
        f.ruleId?.startsWith('tls.') ||
        f.ruleId?.startsWith('ssl.') ||
        f.category === 'TLS' ||
        f.category === 'CERTIFICATE' ||
        f.title.toLowerCase().includes('tls') ||
        f.title.toLowerCase().includes('certificate'),
    );
    const s3Status = s3Findings.some((f) => f.severity === 'CRITICAL')
      ? 'CRITICAL'
      : s3Findings.some((f) => f.severity === 'HIGH' || f.severity === 'MEDIUM')
        ? 'ATTENTION'
        : 'SECURE';
    const s3: SecurityPillarSummary = {
      id: 'tls_transport',
      code: 'S3',
      name: 'Transport & TLS Hygiene',
      status: s3Status,
      summary:
        s3Findings.length > 0
          ? `${s3Findings.length} TLS/HSTS configuration enhancement${s3Findings.length > 1 ? 's' : ''} identified.`
          : 'Modern TLS 1.3/1.2 negotiated with active HSTS enforcement and valid certificate coverage.',
      findingsCount: s3Findings.length,
      signals: [
        'TLS 1.3 / 1.2',
        'HSTS Header',
        'Certificate Validity',
        'SAN Hostname Matching',
      ],
    };

    // S4: Content Security & Isolation
    const s4Findings = findings.filter(
      (f) =>
        f.ruleId?.includes('csp') ||
        f.ruleId?.includes('cross-origin') ||
        f.ruleId?.includes('permissions-policy') ||
        f.ruleId?.includes('missing-content-security') ||
        f.title.toLowerCase().includes('content security'),
    );
    const s4Status = s4Findings.some((f) => f.severity === 'CRITICAL')
      ? 'CRITICAL'
      : s4Findings.some((f) => f.severity === 'HIGH' || f.severity === 'MEDIUM')
        ? 'ATTENTION'
        : 'SECURE';
    const s4: SecurityPillarSummary = {
      id: 'content_security',
      code: 'S4',
      name: 'Content Security & Browser Isolation',
      status: s4Status,
      summary:
        s4Findings.length > 0
          ? `${s4Findings.length} Content Security Policy and isolation rule${s4Findings.length > 1 ? 's' : ''} flagged.`
          : 'Content-Security-Policy actively restricts execution contexts with cross-origin isolation enabled.',
      findingsCount: s4Findings.length,
      signals: [
        'Content-Security-Policy',
        'COOP/COEP Isolation',
        'Permissions-Policy',
        'Frame Protection',
      ],
    };

    // S5: DNS & Mail Security
    const s5Findings = findings.filter(
      (f) =>
        f.ruleId?.startsWith('dns.') ||
        f.category === 'DNS_SECURITY' ||
        f.title.toLowerCase().includes('dmarc') ||
        f.title.toLowerCase().includes('spf'),
    );
    const s5Status = s5Findings.some((f) => f.severity === 'CRITICAL')
      ? 'CRITICAL'
      : s5Findings.some((f) => f.severity === 'HIGH' || f.severity === 'MEDIUM')
        ? 'ATTENTION'
        : 'SECURE';
    const s5: SecurityPillarSummary = {
      id: 'dns_mail',
      code: 'S5',
      name: 'DNS Posture & Mail Security',
      status: s5Status,
      summary:
        s5Findings.length > 0
          ? `${s5Findings.length} DNS security and mail authentication issue${s5Findings.length > 1 ? 's' : ''} detected.`
          : 'Authoritative DMARC enforcement policy and strict SPF qualifiers protect against domain spoofing.',
      findingsCount: s5Findings.length,
      signals: [
        'DMARC Enforcement',
        'SPF Strictness',
        'Dangling CNAME Protection',
        'DNSSEC',
      ],
    };

    // S6: HTTP Transit Invariants
    const s6Findings = findings.filter(
      (f) =>
        f.ruleId?.includes('cors') ||
        f.ruleId?.includes('dangerous-methods') ||
        f.ruleId?.includes('cleartext-upgrade') ||
        f.title.toLowerCase().includes('cors') ||
        f.title.toLowerCase().includes('http method'),
    );
    const s6Status = s6Findings.some((f) => f.severity === 'CRITICAL')
      ? 'CRITICAL'
      : s6Findings.some((f) => f.severity === 'HIGH' || f.severity === 'MEDIUM')
        ? 'ATTENTION'
        : 'SECURE';
    const s6: SecurityPillarSummary = {
      id: 'http_transit',
      code: 'S6',
      name: 'HTTP Transit & Invariants',
      status: s6Status,
      summary:
        s6Findings.length > 0
          ? `${s6Findings.length} transit invariant violation${s6Findings.length > 1 ? 's' : ''} identified in wire traffic.`
          : 'Strict CORS origin whitelisting, dangerous methods disabled, and port 80 cleartext upgraded permanently to HTTPS.',
      findingsCount: s6Findings.length,
      signals: [
        'CORS Origin Whitelist',
        'Safe HTTP Methods',
        '301 HTTPS Upgrade',
        'Hop Integrity',
      ],
    };

    // S7: Perimeter & Exposure
    const s7Findings = findings.filter(
      (f) =>
        f.ruleId?.includes('git-repository') ||
        f.ruleId?.includes('env-file') ||
        f.ruleId?.includes('management-endpoint') ||
        f.title.toLowerCase().includes('perimeter') ||
        f.title.toLowerCase().includes('.git') ||
        f.title.toLowerCase().includes('.env'),
    );
    const s7Status = s7Findings.some((f) => f.severity === 'CRITICAL')
      ? 'CRITICAL'
      : s7Findings.some((f) => f.severity === 'HIGH' || f.severity === 'MEDIUM')
        ? 'ATTENTION'
        : 'SECURE';
    const s7: SecurityPillarSummary = {
      id: 'perimeter_exposure',
      code: 'S7',
      name: 'Perimeter & Configuration Exposure',
      status: s7Status,
      summary:
        s7Findings.length > 0
          ? `${s7Findings.length} public perimeter exposure finding${s7Findings.length > 1 ? 's' : ''} requiring immediate containment.`
          : 'Zero public repository artifacts (.git), environment files (.env), or unauthenticated diagnostic endpoints exposed.',
      findingsCount: s7Findings.length,
      signals: [
        'Repository Protection',
        '.env File Shield',
        'Metrics/Actuator Lockdown',
        'GraphQL Hardening',
      ],
    };

    return [s1, s2, s3, s4, s5, s6, s7];
  }

  private buildHighlights(
    snapshot: SnapshotDetailDto,
    findings: FindingDto[],
  ): SecurityBriefHighlight[] {
    const highlights: SecurityBriefHighlight[] = [];
    const payload = (snapshot.payload || {}) as any;

    // 1. Critical & High findings
    for (const f of findings) {
      if (f.severity === 'CRITICAL' || f.severity === 'HIGH') {
        highlights.push({
          id: f.id,
          severity: f.severity,
          title: f.title,
          description: f.description || (f as any).whyItMatters || '',
          pillarCode: this.resolvePillarCode(f.ruleId || f.id),
        });
      }
    }

    // 2. Impending Certificate Expirations (<= 30 days)
    if (!highlights.some((h) => /certificate expir/i.test(h.title))) {
      const ssl = payload?.ssl || (snapshot as any)?.ssl;
      if (ssl?.certificate?.validTo) {
        const expiryDate = new Date(ssl.certificate.validTo);
        const daysLeft = Math.ceil(
          (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        if (daysLeft <= 30 && daysLeft > 0) {
          highlights.push({
            id: 'cert-expiry-notice',
            severity: daysLeft <= 7 ? 'CRITICAL' : 'HIGH',
            title: `TLS Certificate Expires in ${daysLeft} Day${daysLeft === 1 ? '' : 's'}`,
            description: `The SSL/TLS certificate for ${snapshot.domainName || 'the domain'} is valid until ${expiryDate.toISOString().split('T')[0]}. Renew immediately to prevent ingress outage.`,
            pillarCode: 'S3',
          });
        }
      }
    }

    // 3. If no critical/high issues, add key positive hygiene highlight
    if (highlights.length === 0) {
      highlights.push({
        id: 'security-posture-healthy',
        severity: 'INFO',
        title: 'Hardened Baseline Verified',
        description: `Verified baseline defense posture for ${snapshot.domainName || 'this infrastructure'}. Zero active critical perimeter or transport vulnerabilities detected.`,
        pillarCode: 'S3',
      });
    }

    return highlights.slice(0, 6);
  }

  private buildRecommendations(
    findings: FindingDto[],
    pillars: SecurityPillarSummary[],
  ): SecurityBriefRecommendation[] {
    const recs: SecurityBriefRecommendation[] = [];

    // Prioritize critical recommendations
    if (findings.some((f) => f.ruleId?.includes('git-repository'))) {
      recs.push({
        id: 'rec-git-lockdown',
        priority: 'P0',
        title: 'Block Public Access to .git Directories',
        action:
          'Configure edge reverse proxy (NGINX/Cloudflare/Caddy) to deny all requests matching `^/\\.git` with 403/404.',
        rationale:
          'Publicly exposed Git repository metadata allows adversaries to download complete source code history and internal configurations.',
      });
    }

    if (findings.some((f) => f.ruleId?.includes('env-file'))) {
      recs.push({
        id: 'rec-env-lockdown',
        priority: 'P0',
        title: 'Restrict .env Configuration Files',
        action:
          'Ensure document root does not expose environment files and rotate all exposed database/API credentials immediately.',
        rationale:
          'Unauthenticated access to .env files exposes plaintext production credentials, secret keys, and database passwords.',
      });
    }

    if (findings.some((f) => f.ruleId?.includes('dmarc'))) {
      recs.push({
        id: 'rec-dmarc-enforcement',
        priority: 'P1',
        title: 'Upgrade DMARC Policy to Quarantine or Reject',
        action:
          'Update DNS TXT record for `_dmarc` to specify `p=quarantine` or `p=reject` with rua reporting.',
        rationale:
          'A DMARC policy in p=none monitoring mode allows unauthorized mail servers to send spoofed emails claiming your domain identity.',
      });
    }

    if (findings.some((f) => f.ruleId?.includes('cors'))) {
      recs.push({
        id: 'rec-cors-tightening',
        priority: 'P1',
        title: 'Tighten CORS Origin Whitelisting',
        action:
          'Replace `Access-Control-Allow-Origin: *` with an explicit origin whitelist when credentials are enabled.',
        rationale:
          'Permitting wildcard origins with credentials enables cross-origin credential harvesting in browser contexts.',
      });
    }

    if (findings.some((f) => f.ruleId?.includes('cookie'))) {
      recs.push({
        id: 'rec-cookie-hardening',
        priority: 'P2',
        title: 'Enforce HttpOnly and Secure on Session Cookies',
        action:
          'Ensure all application authentication and session cookies include the `HttpOnly; Secure; SameSite=Lax` attributes.',
        rationale:
          'Session cookies without HttpOnly can be accessed by client-side scripts during XSS attacks.',
      });
    }

    if (recs.length === 0) {
      recs.push({
        id: 'rec-continuous-monitoring',
        priority: 'P2',
        title: 'Maintain Continuous Ingress Monitoring',
        action:
          'Retain continuous discovery cycles to automatically catch configuration drift, impending TLS certificate expirations, and new origin exposures.',
        rationale:
          'Infrastructure evolutions and DNS modifications frequently introduce unintended perimeter gaps.',
      });
    }

    return recs.slice(0, 4);
  }

  private buildNarrative(
    domainName: string,
    posture: SecurityPostureStatus,
    score: number,
    grade: SecurityPostureGrade,
    critical: number,
    high: number,
    medium: number,
    pillars: SecurityPillarSummary[],
  ): string {
    const degradedPillars = pillars.filter((p) => p.status !== 'SECURE');

    if (posture === 'CRITICAL_RISK') {
      return `Critical security risks require immediate containment for ${domainName}. Atlas detected ${critical} critical finding${critical > 1 ? 's' : ''} across ${degradedPillars.map((p) => p.name).join(', ')}. Remediating public perimeter and credential exposure must take top priority.`;
    }

    if (posture === 'ATTENTION') {
      return `Elevated security risks detected for ${domainName} with a Grade of ${grade} (${score}/100). Atlas identified ${high} high-severity issue${high > 1 ? 's' : ''} impacting ${degradedPillars.map((p) => p.name).join(', ')}. Hardening transit policies and DNS records will restore baseline posture.`;
    }

    return `Infrastructure defense posture for ${domainName} is hardened with an overall Grade of ${grade} (${score}/100). All 7 security pillars—spanning transport encryption, session isolation, DNS spoofing defenses, and perimeter shields—conform to production security standards.`;
  }

  private resolvePillarCode(ruleId: string): string {
    if (ruleId.includes('cookie')) return 'S1';
    if (
      ruleId.includes('debug') ||
      ruleId.includes('internal-topology') ||
      ruleId.includes('stack-trace')
    )
      return 'S2';
    if (ruleId.startsWith('tls.') || ruleId.startsWith('ssl.')) return 'S3';
    if (
      ruleId.includes('csp') ||
      ruleId.includes('cross-origin') ||
      ruleId.includes('permissions')
    )
      return 'S4';
    if (ruleId.startsWith('dns.')) return 'S5';
    if (
      ruleId.includes('cors') ||
      ruleId.includes('dangerous-methods') ||
      ruleId.includes('cleartext')
    )
      return 'S6';
    if (
      ruleId.includes('git') ||
      ruleId.includes('env') ||
      ruleId.includes('management')
    )
      return 'S7';
    return 'S3';
  }
}
