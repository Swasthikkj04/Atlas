import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

describe('PT-005: Deep Data Integrity, Lineage & Transaction Audit', () => {
  let prisma: PrismaClient;
  let testUserId: string | null = null;
  let testDomainId: string | null = null;
  let testSnapshotId: string | null = null;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    if (testDomainId) {
      await prisma.domain
        .delete({ where: { id: testDomainId } })
        .catch(() => {});
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('PT-005-A: Enforces complete understanding lineage and zero orphaned intelligence', async () => {
    const user = await prisma.user.create({
      data: {
        email: `pt005-lineage-${Date.now()}@example.com`,
        fullName: 'PT-005 Auditor',
        passwordHash: await argon2.hash('AuditPassword123!'),
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    testUserId = user.id;

    const domain = await prisma.domain.create({
      data: {
        userId: user.id,
        domainName: 'lineage-target.com',
        monitoringEnabled: true,
        understandingStatus: 'IDLE',
      },
    });
    testDomainId = domain.id;

    const job = await prisma.understandingJob.create({
      data: {
        domainId: domain.id,
        status: 'COMPLETED',
        trigger: 'MANUAL',
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 1200,
      },
    });

    const snapshot = await prisma.infrastructureSnapshot.create({
      data: {
        domainId: domain.id,
        jobId: job.id,
        httpStatus: 200,
        responseTimeMs: 110,
        payload: {
          server: 'nginx/1.24.0',
          http: { statusCode: 200 },
          dns: { records: [] },
          tls: { valid: true },
        },
      },
    });
    testSnapshotId = snapshot.id;

    const finding = await prisma.infrastructureFinding.create({
      data: {
        snapshotId: snapshot.id,
        ruleId: 'HTTP_MISSING_CSP',
        module: 'HTTP',
        category: 'SECURITY_HEADER',
        severity: 'HIGH',
        title: 'Missing Content Security Policy',
        description: 'Audit finding description',
      },
    });

    const brief = await prisma.infrastructureBrief.create({
      data: {
        snapshotId: snapshot.id,
        overallHealth: 'HEALTHY',
        summary: 'Perimeter analysis verified 1 edge server and active TLS.',
        highlights: ['Valid TLS certificate'],
        recommendations: ['Configure CSP header'],
      },
    });

    // Invariant assertions
    expect(finding.snapshotId).toBe(snapshot.id);
    expect(brief.snapshotId).toBe(snapshot.id);

    const fetchedSnap = await prisma.infrastructureSnapshot.findUnique({
      where: { id: snapshot.id },
      include: { findings: true, brief: true },
    });
    expect(fetchedSnap?.id).toBe(snapshot.id);
    expect(fetchedSnap?.findings.length).toBe(1);
    expect(fetchedSnap?.brief).toBeDefined();
  });

  it('PT-005-B: Transaction rollback guarantees zero partial or corrupt persistence', async () => {
    expect(testSnapshotId).toBeDefined();

    let rollbackTriggered = false;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.infrastructureFinding.create({
          data: {
            snapshotId: testSnapshotId,
            ruleId: 'HTTP_TEST_ROLLBACK',
            module: 'HTTP',
            category: 'SECURITY_HEADER',
            severity: 'LOW',
            title: 'Temporary finding to be rolled back',
            description: 'Testing rollback atomicity',
          },
        });
        throw new Error('SIMULATED_TRANSACTION_ABORT');
      });
    } catch (err: any) {
      if (err.message === 'SIMULATED_TRANSACTION_ABORT') {
        rollbackTriggered = true;
      }
    }

    expect(rollbackTriggered).toBe(true);

    const rolledBackFinding = await prisma.infrastructureFinding.findFirst({
      where: { ruleId: 'HTTP_TEST_ROLLBACK' },
    });
    expect(rolledBackFinding).toBeNull();
  });

  it('PT-005-D & E: Timeline cursor pagination guarantees deterministic ordering without duplication', async () => {
    expect(testDomainId).toBeDefined();
    expect(testSnapshotId).toBeDefined();

    const baseTime = Date.now() - 300000;
    const changeRecords = Array.from({ length: 30 }, (_, i) => ({
      domainId: testDomainId,
      previousSnapshotId: testSnapshotId,
      currentSnapshotId: testSnapshotId,
      module: 'HTTP' as const,
      category: 'SECURITY_HEADER' as const,
      changeType: 'MODIFIED' as const,
      severity: 'MEDIUM' as const,
      title: `Timeline change #${i + 1}`,
      description: `Description for timeline change #${i + 1}`,
      detectedAt: new Date(baseTime + i * 10000),
    }));

    await prisma.changeHistory.createMany({ data: changeRecords });

    // Fetch Page 1 (10 items)
    const page1 = await prisma.changeHistory.findMany({
      where: { domainId: testDomainId },
      take: 10,
      orderBy: { detectedAt: 'desc' },
    });
    expect(page1.length).toBe(10);
    const cursor1 = page1[page1.length - 1].id;

    // Fetch Page 2 (10 items)
    const page2 = await prisma.changeHistory.findMany({
      where: { domainId: testDomainId },
      take: 10,
      skip: 1,
      cursor: { id: cursor1 },
      orderBy: { detectedAt: 'desc' },
    });
    expect(page2.length).toBe(10);
    const cursor2 = page2[page2.length - 1].id;

    // Fetch Page 3 (10 items)
    const page3 = await prisma.changeHistory.findMany({
      where: { domainId: testDomainId },
      take: 10,
      skip: 1,
      cursor: { id: cursor2 },
      orderBy: { detectedAt: 'desc' },
    });
    expect(page3.length).toBe(10);

    const allIds = [
      ...page1.map((p) => p.id),
      ...page2.map((p) => p.id),
      ...page3.map((p) => p.id),
    ];
    const uniqueIds = new Set(allIds);

    expect(uniqueIds.size).toBe(30);

    for (let i = 0; i < page1.length - 1; i++) {
      expect(page1[i].detectedAt.getTime()).toBeGreaterThanOrEqual(
        page1[i + 1].detectedAt.getTime(),
      );
    }
  });

  it('PT-005-J: Cascading deletion cleans all derived child records without dangling state', async () => {
    expect(testDomainId).toBeDefined();

    const domainIdToDelete = testDomainId;
    await prisma.domain.delete({ where: { id: domainIdToDelete } });
    testDomainId = null;

    const remainingSnapshots = await prisma.infrastructureSnapshot.count({
      where: { domainId: domainIdToDelete },
    });
    const remainingChanges = await prisma.changeHistory.count({
      where: { domainId: domainIdToDelete },
    });
    const remainingFindings = await prisma.infrastructureFinding.count({
      where: { snapshotId: testSnapshotId },
    });

    expect(remainingSnapshots).toBe(0);
    expect(remainingChanges).toBe(0);
    expect(remainingFindings).toBe(0);
  });
});
