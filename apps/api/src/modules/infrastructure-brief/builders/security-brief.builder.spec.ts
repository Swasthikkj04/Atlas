import { SecurityBriefBuilder } from './security-brief.builder';
import { SnapshotDetailDto } from '../../infrastructure-snapshots/dto/snapshot-detail.dto';
import { FindingDto } from '../../infrastructure-findings/dto/finding.dto';

describe('SecurityBriefBuilder', () => {
  let builder: SecurityBriefBuilder;

  beforeEach(() => {
    builder = new SecurityBriefBuilder();
  });

  it('should synthesize a hardened security posture for clean infrastructure', () => {
    const snapshot: SnapshotDetailDto = {
      id: 'snp-1',
      domainId: 'dom-1',
      domainName: 'secure-corp.com',
      createdAt: new Date('2026-08-29T12:00:00Z'),
      payload: {
        domain: 'secure-corp.com',
        ssl: {
          valid: true,
          protocol: 'TLSv1.3',
          certificate: {
            validTo: new Date(
              Date.now() + 180 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        },
      },
    } as any;

    const findings: FindingDto[] = [];

    const brief = builder.build(snapshot, findings);

    expect(brief.domainName).toBe('secure-corp.com');
    expect(brief.securityScore).toBe(100);
    expect(brief.securityGrade).toBe('A+');
    expect(brief.posture).toBe('HARDENED');
    expect(brief.pillars.length).toBe(7);
    expect(brief.pillars.every((p) => p.status === 'SECURE')).toBe(true);
    expect(brief.highlights.length).toBeGreaterThan(0);
    expect(brief.recommendations.length).toBeGreaterThan(0);
  });

  it('should flag CRITICAL_RISK and degrade score when critical perimeter exposure is detected (S7)', () => {
    const snapshot: SnapshotDetailDto = {
      id: 'snp-2',
      domainId: 'dom-2',
      domainName: 'vulnerable-site.io',
      createdAt: new Date(),
      payload: {},
    } as any;

    const findings: FindingDto[] = [
      {
        id: 'f-git-1',
        ruleId: 'security.git-repository-exposure',
        category: 'PERIMETER_SECURITY',
        severity: 'CRITICAL',
        title: 'Exposed .git Repository Detected',
        description:
          'Git repository metadata is publicly accessible at /.git/HEAD',
      } as any,
      {
        id: 'f-env-1',
        ruleId: 'security.env-file-exposure',
        category: 'PERIMETER_SECURITY',
        severity: 'CRITICAL',
        title: 'Exposed .env Configuration File',
        description: 'Sensitive environment variables exposed at /.env',
      } as any,
    ];

    const brief = builder.build(snapshot, findings);

    expect(brief.posture).toBe('CRITICAL_RISK');
    expect(brief.securityScore).toBe(50); // 100 - 25 - 25
    expect(brief.securityGrade).toBe('D');

    const s7 = brief.pillars.find((p) => p.code === 'S7');
    expect(s7).toBeDefined();
    expect(s7?.status).toBe('CRITICAL');
    expect(s7?.findingsCount).toBe(2);

    expect(brief.highlights.some((h) => h.severity === 'CRITICAL')).toBe(true);
    expect(brief.recommendations.some((r) => r.priority === 'P0')).toBe(true);
  });

  it('should promote certificate expiry <= 30 days to highlights with S3 pillar code', () => {
    const expiresSoon = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const snapshot: SnapshotDetailDto = {
      id: 'snp-3',
      domainId: 'dom-3',
      domainName: 'expiring-cert.org',
      createdAt: new Date(),
      payload: {
        ssl: {
          valid: true,
          certificate: {
            validTo: expiresSoon.toISOString(),
          },
        },
      },
    } as any;

    const brief = builder.build(snapshot, []);

    expect(
      brief.highlights.some((h) =>
        h.title.includes('TLS Certificate Expires in'),
      ),
    ).toBe(true);
    const certHighlight = brief.highlights.find((h) =>
      h.title.includes('TLS Certificate Expires'),
    );
    expect(certHighlight?.pillarCode).toBe('S3');
  });

  it('should accurately categorize findings across all 7 pillars', () => {
    const snapshot: SnapshotDetailDto = {
      id: 'snp-4',
      domainId: 'dom-4',
      domainName: 'multi-issue.dev',
      createdAt: new Date(),
      payload: {},
    } as any;

    const findings: FindingDto[] = [
      {
        id: '1',
        ruleId: 'security.auth-cookie-httponly',
        category: 'COOKIE_SECURITY',
        severity: 'HIGH',
        title: 'Missing HttpOnly',
      } as any,
      {
        id: '2',
        ruleId: 'security.debug-header-exposure',
        category: 'SECURITY',
        severity: 'MEDIUM',
        title: 'Debug Header',
      } as any,
      {
        id: '3',
        ruleId: 'tls.hsts-policy-hygiene',
        category: 'TLS',
        severity: 'LOW',
        title: 'HSTS Max-Age',
      } as any,
      {
        id: '4',
        ruleId: 'http.csp-permissive-directives',
        category: 'HEADER_SECURITY',
        severity: 'HIGH',
        title: 'Permissive CSP',
      } as any,
      {
        id: '5',
        ruleId: 'dns.dmarc-policy-hygiene',
        category: 'DNS_SECURITY',
        severity: 'HIGH',
        title: 'DMARC None',
      } as any,
      {
        id: '6',
        ruleId: 'http.insecure-cors-policy',
        category: 'SECURITY',
        severity: 'HIGH',
        title: 'Insecure CORS',
      } as any,
      {
        id: '7',
        ruleId: 'security.git-repository-exposure',
        category: 'PERIMETER_SECURITY',
        severity: 'CRITICAL',
        title: 'Git Exposure',
      } as any,
    ];

    const brief = builder.build(snapshot, findings);

    expect(brief.pillars.find((p) => p.code === 'S1')?.status).toBe(
      'ATTENTION',
    );
    expect(brief.pillars.find((p) => p.code === 'S2')?.status).toBe(
      'ATTENTION',
    );
    expect(brief.pillars.find((p) => p.code === 'S3')?.status).toBe('SECURE');
    expect(brief.pillars.find((p) => p.code === 'S4')?.status).toBe(
      'ATTENTION',
    );
    expect(brief.pillars.find((p) => p.code === 'S5')?.status).toBe(
      'ATTENTION',
    );
    expect(brief.pillars.find((p) => p.code === 'S6')?.status).toBe(
      'ATTENTION',
    );
    expect(brief.pillars.find((p) => p.code === 'S7')?.status).toBe('CRITICAL');
  });
});
