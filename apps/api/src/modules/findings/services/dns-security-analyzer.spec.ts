import { DnsSecurityAnalyzerService } from './dns-security-analyzer.service';

describe('DnsSecurityAnalyzerService', () => {
  let service: DnsSecurityAnalyzerService;

  beforeEach(() => {
    service = new DnsSecurityAnalyzerService();
  });

  describe('analyzeSpf', () => {
    it('returns present=false when no SPF record exists', () => {
      const result = service.analyzeSpf([
        ['google-site-verification=abc'],
        'other-txt=123',
      ]);
      expect(result.present).toBe(false);
      expect(result.isPermissive).toBe(false);
    });

    it('correctly parses strict HardFail and SoftFail SPF policies', () => {
      const hardFail = service.analyzeSpf([
        'v=spf1 include:_spf.google.com -all',
      ]);
      expect(hardFail.present).toBe(true);
      expect(hardFail.qualifier).toBe('HARDFFAIL_ALL');
      expect(hardFail.isPermissive).toBe(false);
      expect(hardFail.includeCount).toBe(1);

      const softFail = service.analyzeSpf([['v=spf1 mx ip4:192.0.2.1 ~all']]);
      expect(softFail.present).toBe(true);
      expect(softFail.qualifier).toBe('SOFTFAIL_ALL');
      expect(softFail.isPermissive).toBe(false);
    });

    it('flags permissive +all or ?all qualifiers as isPermissive=true', () => {
      const passAll = service.analyzeSpf(['v=spf1 include:mail.corp.com +all']);
      expect(passAll.present).toBe(true);
      expect(passAll.qualifier).toBe('PASS_ALL');
      expect(passAll.isPermissive).toBe(true);

      const neutralAll = service.analyzeSpf(['v=spf1 ?all']);
      expect(neutralAll.present).toBe(true);
      expect(neutralAll.qualifier).toBe('NEUTRAL_ALL');
      expect(neutralAll.isPermissive).toBe(true);
    });
  });

  describe('analyzeDmarc', () => {
    it('returns present=false when no DMARC record is found', () => {
      const result = service.analyzeDmarc([]);
      expect(result.present).toBe(false);
      expect(result.isEnforced).toBe(false);
    });

    it('parses strictly enforced DMARC (p=reject / p=quarantine)', () => {
      const reject = service.analyzeDmarc([
        'v=DMARC1; p=reject; sp=reject; pct=100; rua=mailto:dmarc-reports@example.com',
      ]);
      expect(reject.present).toBe(true);
      expect(reject.policy).toBe('REJECT');
      expect(reject.subdomainPolicy).toBe('REJECT');
      expect(reject.percentage).toBe(100);
      expect(reject.isEnforced).toBe(true);
      expect(reject.isMonitoringOnly).toBe(false);
      expect(reject.ruaDestination).toBe('mailto:dmarc-reports@example.com');
    });

    it('flags monitoring mode (p=none) as isMonitoringOnly=true', () => {
      const monitoring = service.analyzeDmarc([
        ['v=DMARC1; p=none; rua=mailto:reports@test.com'],
      ]);
      expect(monitoring.present).toBe(true);
      expect(monitoring.policy).toBe('NONE');
      expect(monitoring.isEnforced).toBe(false);
      expect(monitoring.isMonitoringOnly).toBe(true);
    });
  });

  describe('analyzeDanglingCname', () => {
    it('detects dangling CNAME pointer to de-provisioned GitHub Pages / AWS S3', () => {
      const githubDangling = service.analyzeDanglingCname(
        ['org-docs.github.io'],
        [], // Empty A records
        false, // HTTP unreachable
      );
      expect(githubDangling.hasCname).toBe(true);
      expect(githubDangling.matchedProvider).toBe('GitHub Pages');
      expect(githubDangling.isPotentiallyDangling).toBe(true);

      const s3Dangling = service.analyzeDanglingCname(
        ['bucket-xyz.s3.amazonaws.com'],
        [],
        false,
      );
      expect(s3Dangling.hasCname).toBe(true);
      expect(s3Dangling.matchedProvider).toBe('AWS S3');
      expect(s3Dangling.isPotentiallyDangling).toBe(true);
    });

    it('returns isPotentiallyDangling=false for active, responding targets', () => {
      const active = service.analyzeDanglingCname(
        ['app.herokuapp.com'],
        ['198.51.100.2'],
        true,
      );
      expect(active.hasCname).toBe(true);
      expect(active.isPotentiallyDangling).toBe(false);
    });
  });

  describe('assessDnsSecurityPosture', () => {
    it('scores 100 for hardened domain with strict SPF, reject DMARC, and active CNAME', () => {
      const assessment = service.assessDnsSecurityPosture('hardened.io', {
        txt: ['v=spf1 include:_spf.google.com -all'],
        dmarc: ['v=DMARC1; p=reject; rua=mailto:sec@hardened.io'],
        cname: [],
        a: ['93.184.216.34'],
      });

      expect(assessment.overallScore).toBe(100);
      expect(assessment.isCompliant).toBe(true);
    });

    it('penalizes permissive SPF, monitoring DMARC, and dangling CNAME', () => {
      const assessment = service.assessDnsSecurityPosture(
        'vulnerable.io',
        {
          txt: ['v=spf1 +all'],
          dmarc: ['v=DMARC1; p=none'],
          cname: ['orphaned.azurewebsites.net'],
          a: [],
        },
        false,
      );

      expect(assessment.overallScore).toBeLessThan(50);
      expect(assessment.isCompliant).toBe(false);
      expect(assessment.danglingCname.isPotentiallyDangling).toBe(true);
    });
  });
});
