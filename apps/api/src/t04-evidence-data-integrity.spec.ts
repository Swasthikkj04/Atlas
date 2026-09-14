import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { EvidenceService } from './infrastructure/evidence/services/evidence.service';
import { EvidenceRepository } from './infrastructure/evidence/repositories/evidence.repository';
import { InfrastructureSnapshotService } from './modules/infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureFindingService } from './modules/infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureBriefService } from './modules/infrastructure-brief/services/infrastructure-brief.service';
import { FindingRuleEngineService } from './modules/findings/services/finding-rule-engine.service';
import { ChangeDetectionEngine } from './modules/understanding/services/change-detection.engine';
import { UnderstandingEngine } from './modules/understanding/understanding.engine';
import { DiscoverySnapshot } from './infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  EvidenceCategory,
  FindingCategory,
  FindingModule,
  Severity,
  UserAccountStatus,
  TriggerType,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common';

import { UnderstandingWorker } from './modules/understanding/understanding.worker';

jest.setTimeout(30000);

describe('T-04: Evidence & Data Integrity Certification Suite', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let evidenceService: EvidenceService;
  let evidenceRepository: EvidenceRepository;
  let snapshotService: InfrastructureSnapshotService;
  let findingService: InfrastructureFindingService;
  let briefService: InfrastructureBriefService;
  let findingRuleEngine: FindingRuleEngineService;
  let changeDetectionEngine: ChangeDetectionEngine;
  let understandingEngine: UnderstandingEngine;

  let tenantAUserId: string;
  let tenantADomainId: string;
  const tenantADomainName = `t04-evidence-a-${Date.now()}.io`;

  let tenantBUserId: string;
  let tenantBDomainId: string;
  const tenantBDomainName = `t04-evidence-b-${Date.now()}.io`;

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
    evidenceService = moduleRef.get(EvidenceService);
    evidenceRepository = moduleRef.get(EvidenceRepository);
    snapshotService = moduleRef.get(InfrastructureSnapshotService);
    findingService = moduleRef.get(InfrastructureFindingService);
    briefService = moduleRef.get(InfrastructureBriefService);
    findingRuleEngine = moduleRef.get(FindingRuleEngineService);
    changeDetectionEngine = moduleRef.get(ChangeDetectionEngine);
    understandingEngine = moduleRef.get(UnderstandingEngine);

    // Setup Tenant A User and Domain
    const userA = await prisma.user.create({
      data: {
        email: `t04-user-a-${Date.now()}@example.com`,
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$mockhashA',
        fullName: 'Tenant A Admin',
        status: UserAccountStatus.ACTIVE,
      },
    });
    tenantAUserId = userA.id;

    const domainA = await prisma.domain.create({
      data: {
        domainName: tenantADomainName,
        userId: tenantAUserId,
      },
    });
    tenantADomainId = domainA.id;

    // Setup Tenant B User and Domain
    const userB = await prisma.user.create({
      data: {
        email: `t04-user-b-${Date.now()}@example.com`,
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$mockhashB',
        fullName: 'Tenant B Admin',
        status: UserAccountStatus.ACTIVE,
      },
    });
    tenantBUserId = userB.id;

    const domainB = await prisma.domain.create({
      data: {
        domainName: tenantBDomainName,
        userId: tenantBUserId,
      },
    });
    tenantBDomainId = domainB.id;
  });

  afterAll(async () => {
    const domainIds = [tenantADomainId, tenantBDomainId].filter(Boolean);
    if (domainIds.length > 0) {
      await prisma.infrastructureVerification.deleteMany({
        where: { domainId: { in: domainIds } },
      });
      await prisma.changeHistory.deleteMany({
        where: { domainId: { in: domainIds } },
      });
      await prisma.rawEvidence.deleteMany({
        where: { domainId: { in: domainIds } },
      });
      const snapshots = await prisma.infrastructureSnapshot.findMany({
        where: { domainId: { in: domainIds } },
      });
      const snapIds = snapshots.map((s) => s.id);
      await prisma.infrastructureFinding.deleteMany({
        where: { snapshotId: { in: snapIds } },
      });
      await prisma.infrastructureBrief.deleteMany({
        where: { snapshotId: { in: snapIds } },
      });
      await prisma.infrastructureSnapshot.deleteMany({
        where: { domainId: { in: domainIds } },
      });
      await prisma.understandingJob.deleteMany({
        where: { domainId: { in: domainIds } },
      });
      await prisma.domain.deleteMany({ where: { id: { in: domainIds } } });
    }

    const userIds = [tenantAUserId, tenantBUserId].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    await moduleRef.close();
  });

  // =========================================================================
  // 1. RAW EVIDENCE INTEGRITY & CRYPTOGRAPHIC VERIFICATION
  // =========================================================================
  describe('1. Raw Evidence Integrity & Cryptographic Hashing', () => {
    it('should persist raw evidence exactly as collected and verify SHA-256 integrity', async () => {
      const payloadData = {
        statusCode: 200,
        headers: {
          server: 'nginx/1.24.0',
          'strict-transport-security': 'max-age=31536000',
        },
        dnsRecords: {
          a: ['198.51.100.5'],
          txt: ['v=spf1 include:_spf.example.com ~all'],
        },
      };

      const saved = await evidenceService.saveEvidence({
        domainId: tenantADomainId,
        collectorName: 'http-collector',
        collectorVersion: '1.0.0',
        category: EvidenceCategory.HTTP_RESPONSE,
        payloadType: 'http-response-headers',
        target: `https://${tenantADomainName}`,
        payload: payloadData,
        requestMethod: 'GET',
        responseStatus: 200,
        sourceEndpoint: '127.0.0.1:443',
        targetEndpoint: `https://${tenantADomainName}`,
        protocolVersion: 'HTTP/2',
        transportProtocol: 'TCP',
      });

      expect(saved.evidenceId).toBeDefined();
      expect(saved.hashSha256).toBeDefined();

      // Retrieve evidence by ID
      const retrieved = await evidenceService.getEvidenceById(saved.evidenceId);
      expect(retrieved).toBeDefined();
      expect(retrieved.domainId).toBe(tenantADomainId);
      expect(retrieved.collectorName).toBe('http-collector');
      expect(retrieved.parsedPayload).toEqual(payloadData);

      // Cryptographic verification
      const verification = await evidenceService.verifyIntegrity(
        saved.evidenceId,
      );
      expect(verification.verified).toBe(true);
      expect(verification.storedHash).toBe(saved.hashSha256);
      expect(verification.computedHash).toBe(saved.hashSha256);
    });

    it('should compress large evidence payloads with GZIP and faithfully decompress without alteration', async () => {
      const largePayload = {
        certificateChain: new Array(50).fill({
          subject: `CN=${tenantADomainName}`,
          issuer: "Let's Encrypt Authority X3",
          validFrom: '2026-01-01T00:00:00Z',
          validTo: '2026-12-31T23:59:59Z',
          data: 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...padding-bytes...',
        }),
      };

      const savedCompressed = await evidenceService.saveEvidence({
        domainId: tenantADomainId,
        collectorName: 'tls-collector',
        collectorVersion: '1.0.0',
        category: EvidenceCategory.TLS_CERTIFICATE,
        payloadType: 'tls-chain',
        target: `https://${tenantADomainName}:443`,
        payload: largePayload,
        compress: true,
      });

      expect(savedCompressed.compressionType).toBe('GZIP');

      // Verify decompress upon retrieval
      const retrieved = await evidenceService.getEvidenceById(
        savedCompressed.evidenceId,
      );
      expect(retrieved.compressionType).toBe('GZIP');
      expect(retrieved.parsedPayload).toEqual(largePayload);

      // Verify cryptographic integrity of compressed bytes
      const verification = await evidenceService.verifyIntegrity(
        savedCompressed.evidenceId,
      );
      expect(verification.verified).toBe(true);
    });

    it('should detect tampering if raw evidence payload in database is corrupted', async () => {
      const normal = await evidenceService.saveEvidence({
        domainId: tenantADomainId,
        collectorName: 'dns-collector',
        collectorVersion: '1.0.0',
        category: EvidenceCategory.DNS_RESOLUTION,
        payloadType: 'dns-txt',
        target: tenantADomainName,
        payload: { txt: ['v=spf1 -all'] },
      });

      // Tamper directly in the database
      await prisma.rawEvidence.update({
        where: { id: normal.evidenceId },
        data: { payload: JSON.stringify({ txt: ['v=spf1 +all (TAMPERED)'] }) },
      });

      // Verify that integrity verification detects tampering
      const verification = await evidenceService.verifyIntegrity(
        normal.evidenceId,
      );
      expect(verification.verified).toBe(false);
      expect(verification.computedHash).not.toBe(verification.storedHash);
    });
  });

  // =========================================================================
  // 2. EVIDENCE LINEAGE & PROGRESSIVE DISCLOSURE
  // =========================================================================
  describe('2. Evidence Lineage (Finding -> Rule -> Fact -> Evidence)', () => {
    let snapshotId: string;
    let findingId: string;

    beforeAll(async () => {
      const jobId = randomUUID();
      await prisma.understandingJob.create({
        data: {
          id: jobId,
          domainId: tenantADomainId,
          status: 'PENDING',
          trigger: TriggerType.MANUAL,
        },
      });

      const snapPayload: DiscoverySnapshot = {
        domainName: tenantADomainName,
        dns: {
          txt: ['v=spf1 include:_spf.google.com ~all'],
          dmarc: [],
        },
        http: {
          reachable: true,
          protocol: 'https',
          statusCode: 200,
          headers: {
            server: 'nginx/1.22.0',
          },
        },
      };

      const snap = await snapshotService.saveSnapshot(
        tenantADomainId,
        jobId,
        snapPayload,
      );
      snapshotId = snap.id;

      // Save raw evidence
      await evidenceService.saveEvidence({
        domainId: tenantADomainId,
        snapshotId: snap.id,
        collectorName: 'http-collector',
        collectorVersion: '1.0.0',
        category: EvidenceCategory.HTTP_RESPONSE,
        payloadType: 'http-headers',
        target: `https://${tenantADomainName}`,
        payload: snapPayload.http,
      });

      const findings = await findingRuleEngine.evaluate({
        domainId: tenantADomainId,
        snapshotId: snap.id,
        snapshot: snapPayload,
      });

      await findingService.saveFindings(snap.id, findings);
      await briefService.generate(snap.id);

      const dbFindings = await prisma.infrastructureFinding.findMany({
        where: { snapshotId: snap.id },
      });
      findingId = dbFindings[0].id;
    });

    it('should navigate lineage from finding to explainability detail and underlying evidence', async () => {
      const detail = await findingService.getFindingExplainabilityDetail(
        tenantAUserId,
        findingId,
      );

      expect(detail).toBeDefined();
      expect(detail.id).toBe(findingId);
      expect(detail.rule).toBeDefined();
      expect(detail.rule.ruleId).toBeDefined();
      expect(detail.observations).toBeDefined();
      expect(Array.isArray(detail.evidence)).toBe(true);

      const evidenceResp = await findingService.getFindingEvidence(
        tenantAUserId,
        findingId,
      );
      expect(evidenceResp.findingId).toBe(findingId);
      expect(evidenceResp.domainId).toBe(tenantADomainId);
      expect(evidenceResp.observations.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 3. DATABASE REFERENTIAL INTEGRITY & CASCADING DELETES
  // =========================================================================
  describe('3. Database Referential Integrity & Cascading Behavior', () => {
    it('should reject creating a snapshot with a non-existent domainId or jobId (FK enforcement)', async () => {
      const fakeDomainId = randomUUID();
      const fakeJobId = randomUUID();

      await expect(
        snapshotService.saveSnapshot(fakeDomainId, fakeJobId, {
          domain: 'fake.io',
        } as any),
      ).rejects.toThrow();
    });

    it('should reject creating a finding for a non-existent snapshotId', async () => {
      const fakeSnapshotId = randomUUID();

      await expect(
        prisma.infrastructureFinding.create({
          data: {
            snapshotId: fakeSnapshotId,
            ruleId: 'http.missing-hsts',
            module: FindingModule.HTTP,
            category: FindingCategory.SECURITY_HEADER,
            severity: Severity.HIGH,
            title: 'HSTS Missing',
            description: 'Missing header',
          },
        }),
      ).rejects.toThrow();
    });

    it('should cascade delete all jobs, snapshots, findings, briefs, and raw evidences on domain deletion', async () => {
      // Create isolated domain with full hierarchy
      const tempDomain = await prisma.domain.create({
        data: {
          domainName: `cascade-test-${Date.now()}.io`,
          userId: tenantAUserId,
        },
      });

      const tempJobId = randomUUID();
      await prisma.understandingJob.create({
        data: {
          id: tempJobId,
          domainId: tempDomain.id,
          status: 'PENDING',
          trigger: TriggerType.MANUAL,
        },
      });

      const tempSnap = await snapshotService.saveSnapshot(
        tempDomain.id,
        tempJobId,
        {
          domainName: tempDomain.domainName,
        },
      );

      await prisma.infrastructureFinding.create({
        data: {
          snapshotId: tempSnap.id,
          ruleId: 'dns.missing-spf',
          module: FindingModule.DNS,
          category: FindingCategory.DNS_RECORD,
          severity: Severity.HIGH,
          title: 'SPF Missing',
          description: 'No SPF record',
        },
      });

      await briefService.generate(tempSnap.id);

      await evidenceService.saveEvidence({
        domainId: tempDomain.id,
        snapshotId: tempSnap.id,
        collectorName: 'cascade-collector',
        collectorVersion: '1.0.0',
        category: EvidenceCategory.HTTP_RESPONSE,
        payloadType: 'test',
        target: tempDomain.domainName,
        payload: { test: true },
      });

      // Verify records exist before delete
      expect(
        await prisma.understandingJob.count({
          where: { domainId: tempDomain.id },
        }),
      ).toBe(1);
      expect(
        await prisma.infrastructureSnapshot.count({
          where: { domainId: tempDomain.id },
        }),
      ).toBe(1);
      expect(
        await prisma.infrastructureFinding.count({
          where: { snapshotId: tempSnap.id },
        }),
      ).toBe(1);
      expect(
        await prisma.infrastructureBrief.count({
          where: { snapshotId: tempSnap.id },
        }),
      ).toBe(1);
      expect(
        await prisma.rawEvidence.count({ where: { domainId: tempDomain.id } }),
      ).toBe(1);

      // Delete Domain
      await prisma.domain.delete({ where: { id: tempDomain.id } });

      // Verify Cascading Deletions: 0 orphaned records
      expect(
        await prisma.understandingJob.count({
          where: { domainId: tempDomain.id },
        }),
      ).toBe(0);
      expect(
        await prisma.infrastructureSnapshot.count({
          where: { domainId: tempDomain.id },
        }),
      ).toBe(0);
      expect(
        await prisma.infrastructureFinding.count({
          where: { snapshotId: tempSnap.id },
        }),
      ).toBe(0);
      expect(
        await prisma.infrastructureBrief.count({
          where: { snapshotId: tempSnap.id },
        }),
      ).toBe(0);
      expect(
        await prisma.rawEvidence.count({ where: { domainId: tempDomain.id } }),
      ).toBe(0);
    });
  });

  // =========================================================================
  // 4. TRANSACTION INTEGRITY & ATOMIC ROLLBACK
  // =========================================================================
  describe('4. Transaction Integrity & Rollback', () => {
    it('should roll back multi-step persistence atomically when an intermediate step fails', async () => {
      const rollbackJobId = randomUUID();
      const uncommittedSnapshotId = randomUUID();

      await expect(
        prisma.$transaction(async (tx) => {
          // Step 1: Create Job
          await tx.understandingJob.create({
            data: {
              id: rollbackJobId,
              domainId: tenantADomainId,
              status: 'PENDING',
              trigger: TriggerType.MANUAL,
            },
          });

          // Step 2: Create Snapshot
          await tx.infrastructureSnapshot.create({
            data: {
              id: uncommittedSnapshotId,
              domainId: tenantADomainId,
              jobId: rollbackJobId,
              responseTimeMs: 50,
              httpStatus: 200,
              payload: { domain: tenantADomainName },
            },
          });

          // Step 3: Intentionally throw an error to trigger rollback
          throw new Error(
            'Simulated Database Error During Findings Persistence',
          );
        }),
      ).rejects.toThrow('Simulated Database Error During Findings Persistence');

      // Verify Rollback: Job and Snapshot must NOT exist in the database
      const rolledBackJob = await prisma.understandingJob.findUnique({
        where: { id: rollbackJobId },
      });
      const rolledBackSnap = await prisma.infrastructureSnapshot.findUnique({
        where: { id: uncommittedSnapshotId },
      });

      expect(rolledBackJob).toBeNull();
      expect(rolledBackSnap).toBeNull();
    });
  });

  // =========================================================================
  // 5. IDEMPOTENCY & DUPLICATE PREVENTION
  // =========================================================================
  describe('5. Idempotency & Duplicate Prevention', () => {
    it('should reject creating duplicate snapshots for the same jobId (@unique constraint)', async () => {
      const uniqueJobId = randomUUID();
      await prisma.understandingJob.create({
        data: {
          id: uniqueJobId,
          domainId: tenantADomainId,
          status: 'PENDING',
          trigger: TriggerType.MANUAL,
        },
      });

      // 1st insert succeeds
      const snap1 = await snapshotService.saveSnapshot(
        tenantADomainId,
        uniqueJobId,
        { v: 1 },
      );
      expect(snap1.id).toBeDefined();

      // 2nd insert with same jobId must fail due to unique constraint
      await expect(
        snapshotService.saveSnapshot(tenantADomainId, uniqueJobId, { v: 2 }),
      ).rejects.toThrow();
    });

    it('should idempotently update brief on repeated generation without creating duplicate rows', async () => {
      const briefJobId = randomUUID();
      await prisma.understandingJob.create({
        data: {
          id: briefJobId,
          domainId: tenantADomainId,
          status: 'PENDING',
          trigger: TriggerType.MANUAL,
        },
      });

      const snap = await snapshotService.saveSnapshot(
        tenantADomainId,
        briefJobId,
        { domain: tenantADomainName },
      );

      // 1st generation
      const brief1 = await briefService.generate(snap.id);
      expect(brief1).toBeDefined();

      // 2nd generation on same snapshot
      const brief2 = await briefService.generate(snap.id);
      expect(brief2).toBeDefined();

      // Total briefs for this snapshot in DB must be exactly 1
      const totalBriefs = await prisma.infrastructureBrief.count({
        where: { snapshotId: snap.id },
      });
      expect(totalBriefs).toBe(1);
    });
  });

  // =========================================================================
  // 6. HISTORICAL DATA IMMUTABILITY
  // =========================================================================
  describe('6. Historical Data Immutability', () => {
    it('should keep Snapshot A, Finding A, and Raw Evidence A byte-for-byte untouched when Snapshot B is created', async () => {
      // Step 1: Create State A
      const jobA = randomUUID();
      await prisma.understandingJob.create({
        data: {
          id: jobA,
          domainId: tenantADomainId,
          status: 'PENDING',
          trigger: TriggerType.MANUAL,
        },
      });

      const snapAPayload: DiscoverySnapshot = {
        domainName: tenantADomainName,
        dns: { a: ['192.0.2.1'], txt: ['v=spf1 -all'] },
        http: {
          reachable: true,
          statusCode: 200,
          headers: { server: 'nginx/1.20.0' },
        },
      };

      const snapA = await snapshotService.saveSnapshot(
        tenantADomainId,
        jobA,
        snapAPayload,
      );
      const evA = await evidenceService.saveEvidence({
        domainId: tenantADomainId,
        snapshotId: snapA.id,
        collectorName: 'http',
        collectorVersion: '1.0',
        category: EvidenceCategory.HTTP_RESPONSE,
        payloadType: 'headers',
        target: tenantADomainName,
        payload: snapAPayload.http,
      });

      const findingsA = await findingRuleEngine.evaluate({
        domainId: tenantADomainId,
        snapshotId: snapA.id,
        snapshot: snapAPayload,
      });
      await findingService.saveFindings(snapA.id, findingsA);
      const briefA = await briefService.generate(snapA.id);

      // Record baseline hashes of State A
      const baselineSnapA = await prisma.infrastructureSnapshot.findUnique({
        where: { id: snapA.id },
      });
      const baselineFindingACount = await prisma.infrastructureFinding.count({
        where: { snapshotId: snapA.id },
      });
      const baselineEvA = await prisma.rawEvidence.findUnique({
        where: { id: evA.evidenceId },
      });
      const baselineBriefA = await prisma.infrastructureBrief.findUnique({
        where: { snapshotId: snapA.id },
      });

      // Step 2: Create State B (Changed infrastructure)
      const jobB = randomUUID();
      await prisma.understandingJob.create({
        data: {
          id: jobB,
          domainId: tenantADomainId,
          status: 'PENDING',
          trigger: TriggerType.MANUAL,
        },
      });

      const snapBPayload: DiscoverySnapshot = {
        domainName: tenantADomainName,
        dns: {
          a: ['198.51.100.22'],
          txt: ['v=spf1 include:_spf.google.com ~all'],
        },
        http: {
          reachable: true,
          statusCode: 200,
          headers: { server: 'nginx/1.24.0' },
        },
      };

      const snapB = await snapshotService.saveSnapshot(
        tenantADomainId,
        jobB,
        snapBPayload,
      );
      await evidenceService.saveEvidence({
        domainId: tenantADomainId,
        snapshotId: snapB.id,
        collectorName: 'http',
        collectorVersion: '1.0',
        category: EvidenceCategory.HTTP_RESPONSE,
        payloadType: 'headers',
        target: tenantADomainName,
        payload: snapBPayload.http,
      });

      const findingsB = await findingRuleEngine.evaluate({
        domainId: tenantADomainId,
        snapshotId: snapB.id,
        snapshot: snapBPayload,
      });
      await findingService.saveFindings(snapB.id, findingsB);
      await briefService.generate(snapB.id);

      // Step 3: Verify State A in DB is 100% untouched
      const currentSnapA = await prisma.infrastructureSnapshot.findUnique({
        where: { id: snapA.id },
      });
      const currentFindingACount = await prisma.infrastructureFinding.count({
        where: { snapshotId: snapA.id },
      });
      const currentEvA = await prisma.rawEvidence.findUnique({
        where: { id: evA.evidenceId },
      });
      const currentBriefA = await prisma.infrastructureBrief.findUnique({
        where: { snapshotId: snapA.id },
      });

      expect(JSON.stringify(currentSnapA?.payload)).toEqual(
        JSON.stringify(baselineSnapA?.payload),
      );
      expect(currentFindingACount).toEqual(baselineFindingACount);
      expect(currentEvA?.hashSha256).toEqual(baselineEvA?.hashSha256);
      expect(currentBriefA?.summary).toEqual(baselineBriefA?.summary);
      expect(currentBriefA?.overallHealth).toEqual(
        baselineBriefA?.overallHealth,
      );
    });
  });

  // =========================================================================
  // 7. TENANT ISOLATION AT THE DATA LAYER
  // =========================================================================
  describe('7. Tenant Isolation at the Data Layer', () => {
    let tenantBSnapshotId: string;
    let tenantBFindingId: string;

    beforeAll(async () => {
      const jobB = randomUUID();
      await prisma.understandingJob.create({
        data: {
          id: jobB,
          domainId: tenantBDomainId,
          status: 'PENDING',
          trigger: TriggerType.MANUAL,
        },
      });

      const snapB = await snapshotService.saveSnapshot(tenantBDomainId, jobB, {
        domainName: tenantBDomainName,
        http: { reachable: true, statusCode: 200 },
      });
      tenantBSnapshotId = snapB.id;

      const findings = await findingRuleEngine.evaluate({
        domainId: tenantBDomainId,
        snapshotId: snapB.id,
        snapshot: { domainName: tenantBDomainName },
      });
      await findingService.saveFindings(snapB.id, findings);
      await briefService.generate(snapB.id);

      const dbFinding = await prisma.infrastructureFinding.findFirst({
        where: { snapshotId: snapB.id },
      });
      if (dbFinding) {
        tenantBFindingId = dbFinding.id;
      }
    });

    it('Tenant A cannot retrieve Tenant B snapshot via getSnapshotById', async () => {
      await expect(
        snapshotService.getSnapshotById(tenantAUserId, tenantBSnapshotId),
      ).rejects.toThrow(NotFoundException);
    });

    it('Tenant A cannot retrieve Tenant B brief via getBySnapshotForUser', async () => {
      await expect(
        briefService.getBySnapshotForUser(tenantAUserId, tenantBSnapshotId),
      ).rejects.toThrow(NotFoundException);
    });

    it('Tenant A cannot retrieve Tenant B finding explainability detail', async () => {
      if (tenantBFindingId) {
        await expect(
          findingService.getFindingExplainabilityDetail(
            tenantAUserId,
            tenantBFindingId,
          ),
        ).rejects.toThrow(NotFoundException);
      }
    });
  });
});
