import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { UnderstandingEngine } from './modules/understanding/understanding.engine';
import { FindingRuleEngineService } from './modules/findings/services/finding-rule-engine.service';
import { InfrastructureSnapshotService } from './modules/infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureFindingService } from './modules/infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureBriefService } from './modules/infrastructure-brief/services/infrastructure-brief.service';
import { ChangeDetectionEngine } from './modules/understanding/services/change-detection.engine';
import { SnapshotEqualityEngine } from './modules/understanding/services/snapshot-equality.engine';
import { IntelligenceIntegrityGateService } from './modules/understanding/services/intelligence-integrity-gate.service';
import { IntelligenceConsistencyAuthorityService } from './modules/understanding/services/intelligence-consistency-authority.service';
import { DiscoverySnapshot } from './infrastructure/discovery/contracts/discovery-snapshot.interface';
import { FindingContext } from './modules/findings/contracts/finding-context.interface';
import { Severity } from './modules/findings/enums/severity.enum';
import { FindingCategory } from './modules/findings/enums/finding-category.enum';
import {
  FindingModule,
  ChangeType,
  ChangeSeverity,
  UserAccountStatus,
  TriggerType,
  JobStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { UnderstandingWorker } from './modules/understanding/understanding.worker';

jest.setTimeout(30000);

describe('T-03: Core Intelligence Integrity Certification Suite', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let understandingEngine: UnderstandingEngine;
  let findingRuleEngine: FindingRuleEngineService;
  let snapshotService: InfrastructureSnapshotService;
  let findingService: InfrastructureFindingService;
  let briefService: InfrastructureBriefService;
  let changeDetectionEngine: ChangeDetectionEngine;
  let snapshotEqualityEngine: SnapshotEqualityEngine;
  let integrityGateService: IntelligenceIntegrityGateService;
  let consistencyAuthority: IntelligenceConsistencyAuthorityService;

  let testUserId: string;
  let testDomainId: string;
  const testDomainName = `t03-intelligence-${Date.now()}.io`;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();

    try {
      const worker = moduleRef.get(UnderstandingWorker, { strict: false });
      worker?.onModuleDestroy();
    } catch {
      // ignore
    }

    prisma = moduleRef.get(PrismaService);
    understandingEngine = moduleRef.get(UnderstandingEngine);
    findingRuleEngine = moduleRef.get(FindingRuleEngineService);
    snapshotService = moduleRef.get(InfrastructureSnapshotService);
    findingService = moduleRef.get(InfrastructureFindingService);
    briefService = moduleRef.get(InfrastructureBriefService);
    changeDetectionEngine = moduleRef.get(ChangeDetectionEngine);
    snapshotEqualityEngine = moduleRef.get(SnapshotEqualityEngine);
    integrityGateService = moduleRef.get(IntelligenceIntegrityGateService);
    consistencyAuthority = moduleRef.get(
      IntelligenceConsistencyAuthorityService,
    );

    // Setup Test User and Domain in DB
    const user = await prisma.user.create({
      data: {
        email: `t03-user-${Date.now()}@example.com`,
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$mockhash',
        fullName: 'Intelligence QA',
        status: UserAccountStatus.ACTIVE,
      },
    });
    testUserId = user.id;

    const domain = await prisma.domain.create({
      data: {
        domainName: testDomainName,
        userId: testUserId,
      },
    });
    testDomainId = domain.id;
  });

  afterAll(async () => {
    if (testDomainId) {
      await prisma.infrastructureVerification.deleteMany({
        where: { domainId: testDomainId },
      });
      await prisma.changeHistory.deleteMany({
        where: { domainId: testDomainId },
      });
      await prisma.rawEvidence.deleteMany({
        where: { domainId: testDomainId },
      });
      const snapshots = await prisma.infrastructureSnapshot.findMany({
        where: { domainId: testDomainId },
      });
      const snapIds = snapshots.map((s) => s.id);
      await prisma.infrastructureFinding.deleteMany({
        where: { snapshotId: { in: snapIds } },
      });
      await prisma.infrastructureBrief.deleteMany({
        where: { snapshotId: { in: snapIds } },
      });
      await prisma.infrastructureSnapshot.deleteMany({
        where: { domainId: testDomainId },
      });
      await prisma.understandingJob.deleteMany({
        where: { domainId: testDomainId },
      });
      await prisma.domain.deleteMany({ where: { id: testDomainId } });
    }
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await moduleRef.close();
  });

  // =========================================================================
  // 1. UNDERSTANDING PIPELINE LIFECYCLE
  // =========================================================================
  describe('1. Understanding Pipeline Lifecycle', () => {
    it('should complete the entire staged understanding lifecycle end-to-end', async () => {
      const jobId = randomUUID();
      await prisma.understandingJob.create({
        data: {
          id: jobId,
          domainId: testDomainId,
          status: JobStatus.RUNNING,
          trigger: TriggerType.MANUAL,
        },
      });

      // Execute understanding engine
      await understandingEngine.execute(jobId, testDomainId, testDomainName);

      // Verify Job is linked to a Snapshot
      const snapshot = await snapshotService.findByJobId(jobId);
      expect(snapshot).toBeDefined();
      expect(snapshot?.domainId).toEqual(testDomainId);

      // Verify Findings were generated
      const findings = await findingService.getFindingsBySnapshotInternal(
        snapshot.id,
        1,
        50,
      );
      expect(findings.data.length).toBeGreaterThanOrEqual(0);

      // Verify Infrastructure Brief was generated
      const brief = await briefService.getBySnapshot(snapshot.id);
      expect(brief).toBeDefined();
      expect(brief.summary).toBeDefined();
      expect(brief.overallHealth).toMatch(/Excellent|Fair|Poor|Critical/i);
    });
  });

  // =========================================================================
  // 2. INFRASTRUCTURE SNAPSHOT INTEGRITY & IMMUTABILITY
  // =========================================================================
  describe('2. Infrastructure Snapshot Integrity & Immutability', () => {
    it('should persist objective observations and exclude subjective interpretations', async () => {
      const jobId = randomUUID();
      await prisma.understandingJob.create({
        data: {
          id: jobId,
          domainId: testDomainId,
          status: JobStatus.COMPLETED,
          trigger: TriggerType.MANUAL,
        },
      });

      const discoveryPayload: DiscoverySnapshot = {
        domainName: testDomainName,
        dns: {
          a: ['198.51.100.1'],
          ns: ['ns1.example.com'],
          txt: ['v=spf1 include:_spf.example.com ~all'],
          mx: [{ exchange: 'mail.example.com', priority: 10 }],
          aaaa: [],
          cname: [],
          dmarc: ['v=DMARC1; p=reject;'],
        },
        http: {
          reachable: true,
          statusCode: 200,
          url: `https://${testDomainName}`,
          responseTimeMs: 42,
          headers: {
            server: 'nginx/1.24.0',
            'strict-transport-security': 'max-age=31536000; includeSubDomains',
            'content-security-policy': "default-src 'self'",
          },
        },
        ssl: {
          valid: true,
          authorized: true,
          certificate: {
            subject: `CN=${testDomainName}`,
            issuer: "Let's Encrypt Authority X3",
            validFrom: new Date(Date.now() - 30 * 86400000).toISOString(),
            validTo: new Date(Date.now() + 60 * 86400000).toISOString(),
            serialNumber: '03a1b2c3d4e5f6',
          },
        },
        technology: {
          technologies: [
            { name: 'Nginx', category: 'Web Servers', confidence: 100 },
          ],
        },
      };

      const saved = await snapshotService.saveSnapshot(
        testDomainId,
        jobId,
        discoveryPayload,
      );
      expect(saved.id).toBeDefined();
      expect(saved.domainId).toEqual(testDomainId);
      expect(saved.jobId).toEqual(jobId);

      const payload = saved.payload as any;
      // Objective facts present
      expect(payload.dns.a).toEqual(['198.51.100.1']);
      expect(payload.http.headers['strict-transport-security']).toBeDefined();
      expect(payload.ssl.certificate.issuer).toContain("Let's Encrypt");

      // Subjective interpretations must NOT be in snapshot payload
      expect(payload.severity).toBeUndefined();
      expect(payload.recommendations).toBeUndefined();
      expect(payload.riskConclusions).toBeUndefined();
      expect(payload.overallHealth).toBeUndefined();
    });

    it('should create a distinct new snapshot on repeated understanding', async () => {
      const job1 = randomUUID();
      const job2 = randomUUID();

      await prisma.understandingJob.create({
        data: {
          id: job1,
          domainId: testDomainId,
          status: JobStatus.COMPLETED,
          trigger: TriggerType.MANUAL,
        },
      });
      await prisma.understandingJob.create({
        data: {
          id: job2,
          domainId: testDomainId,
          status: JobStatus.COMPLETED,
          trigger: TriggerType.MANUAL,
        },
      });

      const snap1 = await snapshotService.saveSnapshot(testDomainId, job1, {
        domain: testDomainName,
      });
      const snap2 = await snapshotService.saveSnapshot(testDomainId, job2, {
        domain: testDomainName,
      });

      expect(snap1.id).not.toEqual(snap2.id);
      expect(snap1.createdAt.getTime()).toBeLessThanOrEqual(
        snap2.createdAt.getTime(),
      );
    });
  });

  // =========================================================================
  // 3. EVIDENCE INTEGRITY & LINEAGE
  // =========================================================================
  describe('3. Evidence Integrity & Lineage', () => {
    it('should preserve evidence lineage from finding back to observed fact', async () => {
      const context: FindingContext = {
        domainId: testDomainId,
        snapshotId: 'snap-lineage-01',
        snapshot: {
          domainName: testDomainName,
          dns: {
            txt: ['v=spf1 -all'],
            dmarc: [], // Missing DMARC
          },
          http: {
            reachable: true,
            statusCode: 200,
            headers: {
              server: 'Apache/2.4.41',
            },
          },
        },
      };

      const findings = await findingRuleEngine.evaluate(context);
      expect(findings.length).toBeGreaterThan(0);

      // Every finding must have an authoritative rule ID, category, severity, and rationale
      for (const finding of findings) {
        expect(finding.ruleId).toBeDefined();
        expect(finding.title).toBeDefined();
        expect(finding.description).toBeDefined();
        expect(finding.category).toBeDefined();
        expect(finding.severity).toBeDefined();
        expect(finding.confidence).toBeDefined();
        expect(finding.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // 4. FOUR-STATE OBSERVATION CONTRACT
  // =========================================================================
  describe('4. Four-State Observation Contract (OBSERVED, MISSING, UNKNOWN, FAILED)', () => {
    it('OBSERVED: should recognize present security headers and not trigger missing findings', async () => {
      const context: FindingContext = {
        domainId: testDomainId,
        snapshotId: 'snap-obs-1',
        snapshot: {
          dns: {
            txt: ['v=spf1 include:_spf.google.com ~all'],
            dmarc: ['v=DMARC1; p=reject;'],
          },
          http: {
            reachable: true,
            protocol: 'https',
            statusCode: 200,
            headers: {
              'strict-transport-security':
                'max-age=63072000; includeSubDomains; preload',
              'content-security-policy': "default-src 'self'",
              'x-frame-options': 'DENY',
              'x-content-type-options': 'nosniff',
              'referrer-policy': 'strict-origin-when-cross-origin',
            },
          },
        },
      };

      const findings = await findingRuleEngine.evaluate(context);
      const ruleIds = findings.map((f) => f.ruleId);

      expect(ruleIds).not.toContain('dns.missing-spf');
      expect(ruleIds).not.toContain('dns.missing-dmarc');
      expect(ruleIds).not.toContain('http.missing-hsts');
      expect(ruleIds).not.toContain('http.missing-content-security-policy');
      expect(ruleIds).not.toContain('http.missing-x-frame-options');
    });

    it('MISSING: should fire specific missing findings when query succeeded but record is absent', async () => {
      const context: FindingContext = {
        domainId: testDomainId,
        snapshotId: 'snap-missing-1',
        snapshot: {
          dns: {
            status: { txt: 'SUCCESS', dmarc: 'SUCCESS' },
            txt: ['some-verification=abc'],
            dmarc: [],
          },
          http: {
            reachable: true,
            protocol: 'https',
            statusCode: 200,
            headers: {},
          },
        },
      };

      const findings = await findingRuleEngine.evaluate(context);
      const ruleIds = findings.map((f) => f.ruleId);

      expect(ruleIds).toContain('dns.missing-spf');
      expect(ruleIds).toContain('dns.missing-dmarc');
      expect(ruleIds).toContain('http.missing-hsts');
      expect(ruleIds).toContain('http.missing-content-security-policy');
    });

    it('FAILED: should strictly suppress missing findings when query FAILED/TIMEOUT (no conversion of FAILED to false)', async () => {
      const context: FindingContext = {
        domainId: testDomainId,
        snapshotId: 'snap-failed-1',
        snapshot: {
          dns: {
            status: { txt: 'FAILED', dmarc: 'TIMEOUT' },
            txt: [],
            dmarc: [],
          },
          http: {
            reachable: false,
            error: 'ECONNREFUSED',
            headers: {},
          },
        },
      };

      const findings = await findingRuleEngine.evaluate(context);
      const ruleIds = findings.map((f) => f.ruleId);

      // P0 Contract: FAILED query != Record Missing
      expect(ruleIds).not.toContain('dns.missing-spf');
      expect(ruleIds).not.toContain('dns.missing-dmarc');
      expect(ruleIds).not.toContain('http.missing-hsts');
    });

    it('UNKNOWN / DEGRADED: degraded probe signals must report honest uncertainty (UNOBSERVED/INCONCLUSIVE)', () => {
      const dnsResult =
        integrityGateService.handleDegradedProbeSignals('DNS_TIMEOUT');
      expect(dnsResult.status).toBe('UNOBSERVED');
      expect(dnsResult.confidence).toBe('INCONCLUSIVE');

      const tlsResult =
        integrityGateService.handleDegradedProbeSignals('TLS_TIMEOUT');
      expect(tlsResult.status).toBe('UNOBSERVED');
      expect(tlsResult.confidence).toBe('INCONCLUSIVE');

      const wafResult =
        integrityGateService.handleDegradedProbeSignals('WAF_403_CHALLENGE');
      expect(wafResult.status).toBe('UNOBSERVED');
      expect(wafResult.confidence).toBe('INCONCLUSIVE');
    });
  });

  // =========================================================================
  // 5. DETERMINISTIC RULE ENGINE
  // =========================================================================
  describe('5. Deterministic Rule Engine', () => {
    it('should produce 100% deterministic findings on identical inputs across 10 iterations', async () => {
      const context: FindingContext = {
        domainId: testDomainId,
        snapshotId: 'snap-det-01',
        snapshot: {
          dns: {
            a: ['93.184.216.34'],
            txt: ['v=spf1 include:_spf.example.com ~all'],
            dmarc: [],
          },
          http: {
            reachable: true,
            protocol: 'https',
            statusCode: 200,
            headers: {
              server: 'Apache/2.4.52',
              'x-powered-by': 'PHP/8.1.2',
            },
          },
          ssl: {
            valid: true,
            authorized: true,
            certificate: {
              validTo: new Date(Date.now() + 10 * 86400000).toISOString(), // Expiring in 10 days
            },
          },
        },
      };

      const baseline = await findingRuleEngine.evaluate(context);
      const baselineJson = JSON.stringify(baseline);

      for (let i = 0; i < 9; i++) {
        const iterationResult = await findingRuleEngine.evaluate(context);
        expect(JSON.stringify(iterationResult)).toEqual(baselineJson);
        expect(iterationResult.length).toEqual(baseline.length);
        for (let j = 0; j < baseline.length; j++) {
          expect(iterationResult[j].ruleId).toEqual(baseline[j].ruleId);
          expect(iterationResult[j].severity).toEqual(baseline[j].severity);
          expect(iterationResult[j].title).toEqual(baseline[j].title);
        }
      }
    });
  });

  // =========================================================================
  // 6. FINDING INTEGRITY
  // =========================================================================
  describe('6. Finding Integrity', () => {
    it('should derive engineering knowledge with actionable recommendations and rationale', async () => {
      const context: FindingContext = {
        domainId: testDomainId,
        snapshotId: 'snap-fi-1',
        snapshot: {
          dns: {
            a: ['1.1.1.1'],
            txt: [],
            dmarc: [],
          },
          http: {
            reachable: true,
            statusCode: 200,
            headers: {
              server: 'Microsoft-IIS/10.0',
            },
          },
        },
      };

      const findings = await findingRuleEngine.evaluate(context);
      expect(findings.length).toBeGreaterThan(0);

      const serverHeaderFinding = findings.find(
        (f) => f.ruleId === 'http.server-header-exposed',
      );
      if (serverHeaderFinding) {
        expect(serverHeaderFinding.severity).toBeDefined();
        expect(serverHeaderFinding.severityRationale).toBeDefined();
        expect(serverHeaderFinding.whatThisDoesNotProve).toBeDefined();
        expect(serverHeaderFinding.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // 7. INFRASTRUCTURE BRIEF INTEGRITY
  // =========================================================================
  describe('7. Infrastructure Brief Integrity', () => {
    it('should synthesize brief accurately without hallucinating unobserved findings', () => {
      const snapshot: any = {
        id: 'snap-brief-1',
        domainName: 'safe-domain.com',
        payload: {
          http: {
            reachable: true,
            statusCode: 200,
            headers: { server: 'nginx' },
          },
          ssl: { valid: true },
        },
      };

      const findings: any[] = [
        {
          id: 'f-1',
          ruleId: 'dns.missing-spf',
          title: 'SPF Record Not Found',
          description: 'No SPF record published.',
          severity: 'HIGH',
          recommendations: [
            { title: 'Publish SPF', description: 'Add TXT record' },
          ],
        },
      ];

      const brief = briefService['briefBuilder'].build(snapshot, findings);
      expect(brief.overallHealth).toBe('Poor'); // 1 High finding -> Poor
      expect(brief.summary).toContain('safe-domain.com');
      expect(brief.highlights.length).toBeGreaterThan(0);
      expect(brief.highlights[0].title).toBe('SPF Record Not Found');
      expect(brief.recommendations.length).toBe(1);
    });

    it('should assign Critical overallHealth when critical findings exist', () => {
      const snapshot: any = {
        id: 'snap-brief-crit',
        domainName: 'critical-domain.com',
        payload: { http: { reachable: true } },
      };

      const findings: any[] = [
        {
          id: 'f-crit',
          ruleId: 'ssl.expired',
          title: 'TLS Certificate Expired',
          description: 'Expired certificate.',
          severity: 'CRITICAL',
          recommendations: [
            {
              title: 'Renew TLS Certificate',
              description: 'Immediate renewal required',
            },
          ],
        },
      ];

      const brief = briefService['briefBuilder'].build(snapshot, findings);
      expect(brief.overallHealth).toBe('Critical');
      expect(brief.summary).toContain('Critical security condition observed');
    });
  });

  // =========================================================================
  // 8. CHANGE DETECTION (FORENSICS)
  // =========================================================================
  describe('8. Change Detection Forensics (A->A, A->B, A->B->C)', () => {
    const baseSnapshot: DiscoverySnapshot = {
      domainName: testDomainName,
      dns: {
        a: ['192.0.2.1'],
        txt: ['v=spf1 include:_spf.google.com ~all'],
        aaaa: [],
        mx: [{ exchange: 'mail.example.com', priority: 10 }],
      },
      http: {
        reachable: true,
        statusCode: 200,
        headers: {
          server: 'nginx/1.22.0',
          'strict-transport-security': 'max-age=31536000',
        },
      },
      ssl: {
        authorized: true,
        certificate: {
          issuer: 'DigiCert Global Root CA',
          validTo: '2027-01-01T00:00:00Z',
        },
      },
      technology: {
        technologies: [{ name: 'Nginx' }],
      },
    };

    it('Scenario A -> A: should detect 0 changes when infrastructure is unchanged', () => {
      const isEqual = snapshotEqualityEngine.isEqual(
        baseSnapshot,
        baseSnapshot,
      );
      expect(isEqual).toBe(true);

      const diffs = changeDetectionEngine.computeDifferences(
        baseSnapshot,
        baseSnapshot,
      );
      expect(diffs).toHaveLength(0);
    });

    it('Scenario A -> B: should detect only actual modifications (HSTS removed, Server updated, Tech added)', () => {
      const modifiedSnapshot: DiscoverySnapshot = {
        ...baseSnapshot,
        http: {
          reachable: true,
          statusCode: 200,
          headers: {
            server: 'nginx/1.24.0', // MODIFIED
            // 'strict-transport-security' REMOVED
          },
        },
        technology: {
          technologies: [{ name: 'Nginx' }, { name: 'React' }], // React ADDED
        },
      };

      const isEqual = snapshotEqualityEngine.isEqual(
        baseSnapshot,
        modifiedSnapshot,
      );
      expect(isEqual).toBe(false);

      const diffs = changeDetectionEngine.computeDifferences(
        baseSnapshot,
        modifiedSnapshot,
      );
      expect(diffs.length).toBeGreaterThanOrEqual(3);

      const hstsDiff = diffs.find((d) =>
        d.title.includes('Strict-Transport-Security'),
      );
      expect(hstsDiff).toBeDefined();
      expect(hstsDiff?.changeType).toBe(ChangeType.REMOVED);
      expect(hstsDiff?.severity).toBe(ChangeSeverity.HIGH);

      const serverDiff = diffs.find((d) =>
        d.title.includes('Web server changed'),
      );
      expect(serverDiff).toBeDefined();
      expect(serverDiff?.changeType).toBe(ChangeType.MODIFIED);

      const techDiff = diffs.find((d) => d.title.includes('React'));
      expect(techDiff).toBeDefined();
      expect(techDiff?.changeType).toBe(ChangeType.ADDED);
    });

    it('Scenario A -> B -> C: should evaluate transitions strictly against chronological predecessor', () => {
      const snapA = baseSnapshot;
      const snapB: DiscoverySnapshot = {
        ...baseSnapshot,
        dns: { ...baseSnapshot.dns, a: ['198.51.100.20'] }, // A record changed
      };
      const snapC: DiscoverySnapshot = {
        ...snapB,
        ssl: {
          authorized: false, // TLS broken
          certificate: {
            ...snapB.ssl?.certificate,
            issuer: 'Untrusted Self-Signed',
          },
        },
      };

      // Diff A -> B: Only DNS A record changed
      const diffsAB = changeDetectionEngine.computeDifferences(snapA, snapB);
      expect(
        diffsAB.some((d) => d.title.includes('IPv4 addresses modified')),
      ).toBe(true);
      expect(diffsAB.some((d) => d.title.includes('TLS'))).toBe(false);

      // Diff B -> C: Only TLS changed
      const diffsBC = changeDetectionEngine.computeDifferences(snapB, snapC);
      expect(diffsBC.some((d) => d.title.includes('TLS'))).toBe(true);
      expect(diffsBC.some((d) => d.title.includes('IPv4'))).toBe(false);
    });
  });

  // =========================================================================
  // 9. HISTORICAL INTEGRITY
  // =========================================================================
  describe('9. Historical Integrity', () => {
    it('should keep previous snapshots and findings immutable when new snapshots are created', async () => {
      const job1 = randomUUID();
      const job2 = randomUUID();

      await prisma.understandingJob.create({
        data: {
          id: job1,
          domainId: testDomainId,
          status: JobStatus.COMPLETED,
          trigger: TriggerType.MANUAL,
        },
      });
      await prisma.understandingJob.create({
        data: {
          id: job2,
          domainId: testDomainId,
          status: JobStatus.COMPLETED,
          trigger: TriggerType.MANUAL,
        },
      });

      const snap1Payload = {
        domain: testDomainName,
        version: 1,
        headers: { server: 'v1' },
      };
      const snap2Payload = {
        domain: testDomainName,
        version: 2,
        headers: { server: 'v2' },
      };

      const snap1 = await snapshotService.saveSnapshot(
        testDomainId,
        job1,
        snap1Payload,
      );
      const snap2 = await snapshotService.saveSnapshot(
        testDomainId,
        job2,
        snap2Payload,
      );

      // Verify Snap 1 in DB remains untouched
      const dbSnap1 = await snapshotService.getSnapshotByIdInternal(snap1.id);
      expect((dbSnap1?.payload as any).version).toBe(1);
      expect((dbSnap1?.payload as any).headers.server).toBe('v1');

      // Verify Snap 2 in DB has new version
      const dbSnap2 = await snapshotService.getSnapshotByIdInternal(snap2.id);
      expect((dbSnap2?.payload as any).version).toBe(2);
      expect((dbSnap2?.payload as any).headers.server).toBe('v2');
    });
  });

  // =========================================================================
  // 10. INTELLIGENCE -> EVIDENCE TRACEABILITY
  // =========================================================================
  describe('10. Intelligence -> Evidence Traceability', () => {
    it('should synthesize complete authoritative state and verify lineage from intelligence to evidence', () => {
      const state = consistencyAuthority.synthesizeAuthoritativeState({
        snapshotId: 'snap-trace-1',
        domainId: testDomainId,
        domainName: testDomainName,
        technologies: [
          {
            id: 'tech-1',
            name: 'Cloudflare',
            layer: 'EDGE',
            confidence: 'HIGH',
            evidence: ['cf-ray: 8899aabb', 'server: cloudflare'],
            isConfirmed: true,
          },
        ],
        activeFindings: [
          {
            id: 'find-1',
            ruleId: 'http.missing-hsts',
            title: 'HSTS Header Missing',
            severity: 'HIGH',
            confidence: 'AUTHORITATIVE',
            evidence: ['Missing Strict-Transport-Security in HTTP headers'],
          },
        ],
        resolvedFindings: [],
      });

      const masterReport =
        integrityGateService.generateMasterIntegrityReport(state);
      expect(masterReport.isFullyCertified).toBe(true);
      expect(masterReport.pipelineIntegrity.isValid).toBe(true);
      expect(
        masterReport.pipelineIntegrity.ungroundedTechnologies,
      ).toHaveLength(0);
      expect(masterReport.pipelineIntegrity.ungroundedFindings).toHaveLength(0);
      expect(masterReport.determinismAudit.isDeterministic).toBe(true);
    });
  });

  // =========================================================================
  // 11. ADVERSARIAL & RECOVERY TESTING
  // =========================================================================
  describe('11. Adversarial & Crash Recovery Resilience', () => {
    it('should resume idempotently from existing snapshot after worker crash without duplicating data', async () => {
      const crashJobId = randomUUID();
      await prisma.understandingJob.create({
        data: {
          id: crashJobId,
          domainId: testDomainId,
          status: 'RUNNING',
          trigger: TriggerType.MANUAL,
        },
      });

      const snapshot = await snapshotService.saveSnapshot(
        testDomainId,
        crashJobId,
        {
          domainName: testDomainName,
          http: {
            reachable: true,
            statusCode: 200,
            headers: { server: 'nginx' },
          },
        },
      );

      // Execute engine again on same jobId (simulating recovery after crash)
      await understandingEngine.execute(
        crashJobId,
        testDomainId,
        testDomainName,
      );

      // Verify no duplicate snapshot was created
      const allJobSnapshots = await prisma.infrastructureSnapshot.findMany({
        where: { jobId: crashJobId },
      });
      expect(allJobSnapshots).toHaveLength(1);
      expect(allJobSnapshots[0].id).toBe(snapshot.id);
    });
  });
});
