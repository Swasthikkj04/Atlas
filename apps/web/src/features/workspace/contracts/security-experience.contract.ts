import type { InfrastructureFindingDto } from '../../../types/api';

export type FindingDto = InfrastructureFindingDto;

export type SecurityPostureGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
export type SecurityPostureStatus = 'HARDENED' | 'ATTENTION' | 'CRITICAL_RISK' | 'BASELINE';
export type SecurityPillarHealth = 'SECURE' | 'ATTENTION' | 'CRITICAL' | 'UNAUDITED';
export type SecurityPillarCode = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7';

export interface SecurityPillarSummary {
  readonly id: 'cookie_session' | 'data_leakage' | 'tls_transport' | 'content_security' | 'dns_mail' | 'http_transit' | 'perimeter_exposure';
  readonly name: string;
  readonly code: SecurityPillarCode;
  readonly status: SecurityPillarHealth;
  readonly summary: string;
  readonly findingsCount: number;
  readonly signals: readonly string[];
}

export interface SecurityBriefHighlight {
  readonly id: string;
  readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  readonly title: string;
  readonly description: string;
  readonly pillarCode?: string;
}

export interface SecurityBriefRecommendation {
  readonly id: string;
  readonly priority: 'P0' | 'P1' | 'P2';
  readonly title: string;
  readonly action: string;
  readonly rationale: string;
}

export interface SecurityBriefResult {
  readonly domainName: string;
  readonly posture: SecurityPostureStatus;
  readonly securityScore: number;
  readonly securityGrade: SecurityPostureGrade;
  readonly securitySummary: string;
  readonly highlights: readonly SecurityBriefHighlight[];
  readonly pillars: readonly SecurityPillarSummary[];
  readonly recommendations: readonly SecurityBriefRecommendation[];
  readonly verifiedAt: string;
}

export interface WorkspaceSecurityOverviewDto {
  readonly domainId: string;
  readonly domainName: string;
  readonly securityBrief: SecurityBriefResult;
  readonly securityPillars: readonly SecurityPillarSummary[];
  readonly securityFindings: readonly FindingDto[];
  readonly securityScore: number;
  readonly securityGrade: SecurityPostureGrade;
  readonly posture: SecurityPostureStatus;
  readonly verifiedAt: string;
}

export const SECURITY_PILLAR_DEFINITIONS: Record<SecurityPillarCode, { name: string; description: string; category: string }> = {
  S1: {
    name: 'Cookie & Session Security',
    description: 'HttpOnly, Secure, SameSite, and Partitioning attributes on session cookies.',
    category: 'COOKIE_SECURITY',
  },
  S2: {
    name: 'Data Leakage & Debug Exposure',
    description: 'Debug headers, internal RFC 1918 IPs, and unhandled stack traces in wire responses.',
    category: 'SECURITY',
  },
  S3: {
    name: 'Transport & TLS Hygiene',
    description: 'Modern TLS 1.3/1.2 protocols, HSTS preload, SAN validity, and certificate lifecycle horizon.',
    category: 'TLS',
  },
  S4: {
    name: 'Content Security & Browser Isolation',
    description: 'Content-Security-Policy directives, Cross-Origin Isolation (COOP/COEP), and Permissions-Policy.',
    category: 'HEADER_SECURITY',
  },
  S5: {
    name: 'DNS Posture & Mail Security',
    description: 'Authoritative DMARC enforcement (p=reject/quarantine), strict SPF qualifiers, and dangling CNAMEs.',
    category: 'DNS_SECURITY',
  },
  S6: {
    name: 'HTTP Transit & Invariants',
    description: 'Strict CORS origin whitelisting, restriction of dangerous HTTP methods, and permanent port 80 301 upgrade.',
    category: 'SECURITY',
  },
  S7: {
    name: 'Perimeter & Configuration Exposure',
    description: 'Zero exposure of .git/HEAD repositories, .env configuration files, or public /metrics endpoints.',
    category: 'PERIMETER_SECURITY',
  },
};

export function computeSecurityGradeFromScore(score: number): SecurityPostureGrade {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export function getSecurityPostureBadgeConfig(posture: SecurityPostureStatus): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  accentColor: string;
} {
  switch (posture) {
    case 'CRITICAL_RISK':
      return {
        label: 'Critical Risk',
        bgClass: 'bg-[#FDEBEC] dark:bg-[#3D1418]',
        textClass: 'text-[#A93442] dark:text-[#F87171]',
        borderClass: 'border-[#E9B3B9] dark:border-[#7F1D1D]',
        accentColor: '#C94B58',
      };
    case 'ATTENTION':
      return {
        label: 'Attention Required',
        bgClass: 'bg-[#FFF4E3] dark:bg-[#3D2614]',
        textClass: 'text-[#B86F18] dark:text-[#FBBF24]',
        borderClass: 'border-[#F0D3A5] dark:border-[#78350F]',
        accentColor: '#C98224',
      };
    case 'BASELINE':
      return {
        label: 'Baseline Established',
        bgClass: 'bg-[#F0F7FF] dark:bg-[#122238]',
        textClass: 'text-[#1D63B8] dark:text-[#60A5FA]',
        borderClass: 'border-[#BFDBFE] dark:border-[#1E3A8A]',
        accentColor: '#2563EB',
      };
    case 'HARDENED':
    default:
      return {
        label: 'Hardened Baseline',
        bgClass: 'bg-[#EAF7F2] dark:bg-[#102D23]',
        textClass: 'text-[#178A68] dark:text-[#34D399]',
        borderClass: 'border-[#B9E5D6] dark:border-[#065F46]',
        accentColor: '#1F9D73',
      };
  }
}

export function getPillarHealthBadgeConfig(health: SecurityPillarHealth): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (health) {
    case 'CRITICAL':
      return {
        label: 'Critical Gaps',
        badgeClass: 'text-[#A93442] bg-[#FDEBEC] border-[#E9B3B9] dark:bg-[#3D1418] dark:text-[#F87171] dark:border-[#7F1D1D]',
        dotClass: 'bg-[#C94B58]',
      };
    case 'ATTENTION':
      return {
        label: 'Review Needed',
        badgeClass: 'text-[#B86F18] bg-[#FFF4E3] border-[#F0D3A5] dark:bg-[#3D2614] dark:text-[#FBBF24] dark:border-[#78350F]',
        dotClass: 'bg-[#C98224]',
      };
    case 'UNAUDITED':
      return {
        label: 'Unaudited',
        badgeClass: 'text-[#71717A] bg-[#F4F4F5] border-[#E4E4E7] dark:bg-[#27272A] dark:text-[#A1A1AA] dark:border-[#3F3F46]',
        dotClass: 'bg-[#71717A]',
      };
    case 'SECURE':
    default:
      return {
        label: 'Hardened',
        badgeClass: 'text-[#178A68] bg-[#EAF7F2] border-[#B9E5D6] dark:bg-[#102D23] dark:text-[#34D399] dark:border-[#065F46]',
        dotClass: 'bg-[#1F9D73]',
      };
  }
}

export function filterSecurityRelevantFindings(findings: readonly FindingDto[]): FindingDto[] {
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

  return findings.filter((f) => {
    const cat = (f.category || '').toUpperCase();
    const isSecurityCategory =
      cat === 'SECURITY' ||
      cat === 'TLS' ||
      cat === 'SSL' ||
      cat === 'CERTIFICATE' ||
      cat === 'DNS_SECURITY' ||
      cat === 'CONFIGURATION_SECURITY' ||
      cat === 'HEADER_SECURITY' ||
      cat === 'COOKIE_SECURITY' ||
      cat === 'PERIMETER_SECURITY';
    const ruleId = f.rule?.ruleId || (f as { ruleId?: string }).ruleId || f.id || '';
    const matchesPrefix = securityRulePrefixes.some(
      (p) => ruleId.startsWith(p),
    );
    return isSecurityCategory || matchesPrefix;
  });
}
