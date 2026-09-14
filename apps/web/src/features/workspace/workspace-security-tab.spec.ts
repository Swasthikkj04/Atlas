import { describe, it, expect, vi } from 'vitest';
import {
  computeSecurityGradeFromScore,
  getSecurityPostureBadgeConfig,
  getPillarHealthBadgeConfig,
  filterSecurityRelevantFindings,
  SECURITY_PILLAR_DEFINITIONS,
  type SecurityBriefResult,
  type WorkspaceSecurityOverviewDto,
} from './contracts/security-experience.contract';
import type { FindingDto } from '../../types/api';

describe('Workspace Securities Tab & Security Brief (WX-SEC-101)', () => {
  describe('Security Contract & Grading Logic', () => {
    it('accurately computes grades across the score spectrum', () => {
      expect(computeSecurityGradeFromScore(100)).toBe('A+');
      expect(computeSecurityGradeFromScore(95)).toBe('A+');
      expect(computeSecurityGradeFromScore(94)).toBe('A');
      expect(computeSecurityGradeFromScore(85)).toBe('A');
      expect(computeSecurityGradeFromScore(84)).toBe('B');
      expect(computeSecurityGradeFromScore(75)).toBe('B');
      expect(computeSecurityGradeFromScore(74)).toBe('C');
      expect(computeSecurityGradeFromScore(65)).toBe('C');
      expect(computeSecurityGradeFromScore(64)).toBe('D');
      expect(computeSecurityGradeFromScore(50)).toBe('D');
      expect(computeSecurityGradeFromScore(49)).toBe('F');
      expect(computeSecurityGradeFromScore(0)).toBe('F');
    });

    it('returns appropriate badge configuration for all posture states', () => {
      const hardened = getSecurityPostureBadgeConfig('HARDENED');
      expect(hardened.label).toBe('Hardened Baseline');
      expect(hardened.textClass).toContain('text-[#178A68]');

      const attention = getSecurityPostureBadgeConfig('ATTENTION');
      expect(attention.label).toBe('Attention Required');
      expect(attention.textClass).toContain('text-[#B86F18]');

      const critical = getSecurityPostureBadgeConfig('CRITICAL_RISK');
      expect(critical.label).toBe('Critical Risk');
      expect(critical.textClass).toContain('text-[#A93442]');

      const baseline = getSecurityPostureBadgeConfig('BASELINE');
      expect(baseline.label).toBe('Baseline Established');
    });

    it('returns appropriate badge configuration for pillar health states', () => {
      expect(getPillarHealthBadgeConfig('SECURE').label).toBe('Hardened');
      expect(getPillarHealthBadgeConfig('ATTENTION').label).toBe('Review Needed');
      expect(getPillarHealthBadgeConfig('CRITICAL').label).toBe('Critical Gaps');
      expect(getPillarHealthBadgeConfig('UNAUDITED').label).toBe('Unaudited');
    });

    it('defines all 7 security defense pillars (S1 - S7)', () => {
      const pillars = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'] as const;
      pillars.forEach((p) => {
        expect(SECURITY_PILLAR_DEFINITIONS[p]).toBeDefined();
        expect(SECURITY_PILLAR_DEFINITIONS[p].name).toBeTruthy();
        expect(SECURITY_PILLAR_DEFINITIONS[p].description).toBeTruthy();
      });
    });

    it('filters security relevant findings accurately', () => {
      const findings: FindingDto[] = [
        {
          id: 'f-1',
          rule: {
            ruleId: 'security.auth-cookie-httponly-missing',
            name: 'Cookie missing HttpOnly',
            ruleVersion: '1.0.0',
            category: 'SECURITY',
            evaluationLogic: 'Flag cookies missing HttpOnly flag',
          },
          title: 'Cookie missing HttpOnly',
          category: 'SECURITY',
          severity: 'HIGH',
          explanation: 'XSS session theft',
          remediation: 'Add HttpOnly',
          domainId: 'd-1',
          snapshotId: 's-1',
          status: 'ACTIVE',
          detectedAt: '2026-08-29T00:00:00Z',
        },
        {
          id: 'f-2',
          rule: {
            ruleId: 'tls.certificate-impending-expiry',
            name: 'TLS Certificate expires in 12 days',
            ruleVersion: '1.0.0',
            category: 'TLS',
            evaluationLogic: 'Flag certs expiring soon',
          },
          title: 'TLS Certificate expires in 12 days',
          category: 'TLS',
          severity: 'HIGH',
          explanation: 'Downtime and security warnings',
          remediation: 'Renew cert',
          domainId: 'd-1',
          snapshotId: 's-1',
          status: 'ACTIVE',
          detectedAt: '2026-08-29T00:00:00Z',
        },
        {
          id: 'f-3',
          rule: {
            ruleId: 'hosting.generic-cdn-detected',
            name: 'Cloudflare CDN detected',
            ruleVersion: '1.0.0',
            category: 'INFRASTRUCTURE',
            evaluationLogic: 'Detect CDN',
          },
          title: 'Cloudflare CDN detected',
          category: 'INFRASTRUCTURE',
          severity: 'INFORMATIONAL',
          explanation: 'Info note',
          remediation: 'None',
          domainId: 'd-1',
          snapshotId: 's-1',
          status: 'ACTIVE',
          detectedAt: '2026-08-29T00:00:00Z',
        },
      ];

      const securityFindings = filterSecurityRelevantFindings(findings);
      expect(securityFindings).toHaveLength(2);
      expect(securityFindings.map((f) => f.id)).toEqual(['f-1', 'f-2']);
    });
  });

  describe('Security Intelligence Mock Payload & Invariants', () => {
    const mockSecurityOverview: WorkspaceSecurityOverviewDto = {
      domainId: 'domain-prod-123',
      domainName: 'production.internal.io',
      securityScore: 80,
      securityGrade: 'B',
      posture: 'ATTENTION',
      verifiedAt: '2026-08-29T12:00:00.000Z',
      securityBrief: {
        domainName: 'production.internal.io',
        posture: 'ATTENTION',
        securityScore: 80,
        securityGrade: 'B',
        securitySummary:
          'Security posture for production.internal.io shows moderate resilience (Score 80/100, Grade B). 1 critical gap and 1 review item detected across 7 defense pillars.',
        highlights: [
          {
            id: 'h-1',
            severity: 'HIGH',
            title: 'Impending TLS Expiry (14 Days Remaining)',
            description: 'Certificate for production.internal.io expires in 14 days. Immediate renewal required.',
            pillarCode: 'S3',
          },
          {
            id: 'h-2',
            severity: 'CRITICAL',
            title: 'Critical Cookie Security Gap',
            description: 'Session cookie sid lacks HttpOnly and Secure flags.',
            pillarCode: 'S1',
          },
        ],
        pillars: [
          {
            id: 'cookie_session',
            name: 'Cookie & Session Security',
            code: 'S1',
            status: 'CRITICAL',
            summary: '1 critical cookie vulnerability detected.',
            findingsCount: 1,
            signals: ['Cookie: sid', 'Missing HttpOnly', 'Missing Secure'],
          },
          {
            id: 'data_leakage',
            name: 'Data Leakage & Debug Exposure',
            code: 'S2',
            status: 'SECURE',
            summary: 'Zero debug headers or internal IP disclosures detected.',
            findingsCount: 0,
            signals: ['Zero Debug Headers', 'No Internal RFC1918 IPs'],
          },
          {
            id: 'tls_transport',
            name: 'Transport & TLS Hygiene',
            code: 'S3',
            status: 'ATTENTION',
            summary: 'Impending certificate expiry within 14 days.',
            findingsCount: 1,
            signals: ['TLS 1.3', 'HSTS Enforced', 'Expires in 14d'],
          },
          {
            id: 'content_security',
            name: 'Content Security & Browser Isolation',
            code: 'S4',
            status: 'SECURE',
            summary: 'Strict CSP directives and framing protection verified.',
            findingsCount: 0,
            signals: ['Strict CSP', 'COOP Same-Origin', 'X-Frame-Options DENY'],
          },
          {
            id: 'dns_mail',
            name: 'DNS Posture & Mail Security',
            code: 'S5',
            status: 'SECURE',
            summary: 'DMARC policy p=reject enforced.',
            findingsCount: 0,
            signals: ['DMARC p=reject', 'SPF -all Strict'],
          },
          {
            id: 'http_transit',
            name: 'HTTP Transit & Invariants',
            code: 'S6',
            status: 'SECURE',
            summary: 'No wildcard CORS reflections and permanent port 80 upgrade.',
            findingsCount: 0,
            signals: ['Permanent 301 HTTPS Upgrade', 'Safe HTTP Methods'],
          },
          {
            id: 'perimeter_exposure',
            name: 'Perimeter & Configuration Exposure',
            code: 'S7',
            status: 'SECURE',
            summary: 'No public .git, .env, or metrics exposures verified.',
            findingsCount: 0,
            signals: ['No .git Exposure', 'No .env Leakage', 'No Prometheus /metrics'],
          },
        ],
        recommendations: [
          {
            id: 'rec-1',
            priority: 'P0',
            title: 'Renew Impending TLS Certificate',
            action: 'Trigger automated ACME / Let’s Encrypt renewal for production.internal.io before expiration in 14 days.',
            rationale: 'Prevent customer-facing HTTPS termination failure and browser security warnings.',
          },
          {
            id: 'rec-2',
            priority: 'P0',
            title: 'Harden Session Cookies with HttpOnly and Secure Flags',
            action: 'Configure Set-Cookie directives with HttpOnly, Secure, and SameSite=Lax/Strict on session token cookies.',
            rationale: 'Mitigates cross-site scripting (XSS) session hijacking and unencrypted token transit.',
          },
        ],
        verifiedAt: '2026-08-29T12:00:00.000Z',
      },
      securityPillars: [],
      securityFindings: [
        {
          id: 'f-tls-exp',
          rule: {
            ruleId: 'tls.certificate-impending-expiry',
            name: 'Impending TLS Expiry (14 Days Remaining)',
            ruleVersion: '1.0.0',
            category: 'TLS',
            evaluationLogic: 'Flag certs expiring soon',
          },
          title: 'Impending TLS Expiry (14 Days Remaining)',
          category: 'TLS',
          severity: 'HIGH',
          explanation: 'Prevents sudden certificate expiration outages',
          remediation: 'Renew TLS certificate immediately',
          domainId: 'domain-prod-123',
          snapshotId: 's-prod-1',
          status: 'ACTIVE',
          detectedAt: '2026-08-29T12:00:00.000Z',
        },
      ],
    };

    it('validates the structure of the Security Brief and 7-Pillars payload', () => {
      expect(mockSecurityOverview.securityBrief.domainName).toBe('production.internal.io');
      expect(mockSecurityOverview.securityBrief.securityScore).toBe(80);
      expect(mockSecurityOverview.securityBrief.securityGrade).toBe('B');
      expect(mockSecurityOverview.securityBrief.pillars).toHaveLength(7);
      expect(mockSecurityOverview.securityBrief.highlights).toHaveLength(2);
      expect(mockSecurityOverview.securityBrief.highlights[0].title).toContain('14 Days Remaining');
      expect(mockSecurityOverview.securityBrief.recommendations).toHaveLength(2);
    });
  });
});
