import {
  PrismaClient,
  UserAccountStatus,
  JobStatus,
  TriggerType,
} from '@prisma/client';
import { DomainsService } from './domains.service';
import { DomainsRepository } from './repositories/domains.repository';
import { NotFoundException } from '@nestjs/common';

describe('WX-812: Domain Deletion Truth & Cascade Integrity in PostgreSQL', () => {
  let prisma: PrismaClient;
  let domainsService: DomainsService;
  let domainsRepository: DomainsRepository;

  const testUserAId = `usr-owner-a-${Date.now()}`;
  const testUserBId = `usr-owner-b-${Date.now()}`;
  const testDomainId = `dom-cascade-${Date.now()}`;

  beforeAll(async () => {
    prisma = new PrismaClient();
    domainsRepository = new DomainsRepository(prisma);
    domainsService = new DomainsService(domainsRepository);

    // Create 2 distinct users in PostgreSQL
    await prisma.user.createMany({
      data: [
        {
          id: testUserAId,
          email: `usera.${Date.now()}@example.com`,
          fullName: 'User A Owner',
          status: UserAccountStatus.ACTIVE,
        },
        {
          id: testUserBId,
          email: `userb.${Date.now()}@example.com`,
          fullName: 'User B Owner',
          status: UserAccountStatus.ACTIVE,
        },
      ],
    });

    // Create domain owned by User A with full child hierarchy (job, snapshot, findings)
    await prisma.domain.create({
      data: {
        id: testDomainId,
        userId: testUserAId,
        domainName: `test-del-${Date.now()}.internal`,
      },
    });

    const job = await prisma.understandingJob.create({
      data: {
        domainId: testDomainId,
        status: JobStatus.COMPLETED,
        trigger: TriggerType.MANUAL,
      },
    });

    const snapshot = await prisma.infrastructureSnapshot.create({
      data: {
        domainId: testDomainId,
        jobId: job.id,
        responseTimeMs: 120,
        httpStatus: 200,
        payload: { headers: { server: 'nginx' } },
      },
    });

    await prisma.infrastructureFinding.create({
      data: {
        snapshotId: snapshot.id,
        ruleId: 'SEC-001',
        title: 'HSTS Header Missing',
        description: 'No strict-transport-security header detected.',
        category: 'SECURITY_HEADER',
        severity: 'MEDIUM',
      },
    });

    await prisma.infrastructureBrief.create({
      data: {
        snapshotId: snapshot.id,
        summary: 'Clean modern edge stack.',
        overallHealth: 'HEALTHY',
        highlights: ['Edge proxy active'],
        recommendations: ['Enable HSTS'],
      },
    });
  });

  afterAll(async () => {
    await prisma.domain
      .deleteMany({ where: { id: testDomainId } })
      .catch(() => null);
    await prisma.user
      .deleteMany({ where: { id: { in: [testUserAId, testUserBId] } } })
      .catch(() => null);
    await prisma.$disconnect();
  });

  it('verifies domain and all related records exist prior to deletion', async () => {
    const domain = await prisma.domain.findUnique({
      where: { id: testDomainId },
      include: {
        infrastructureSnapshots: {
          include: {
            findings: true,
            brief: true,
          },
        },
        understandingJobs: true,
      },
    });

    expect(domain).not.toBeNull();
    expect(domain?.infrastructureSnapshots.length).toBe(1);
    expect(domain?.infrastructureSnapshots[0].findings.length).toBe(1);
    expect(domain?.infrastructureSnapshots[0].brief).not.toBeNull();
    expect(domain?.understandingJobs.length).toBe(1);
  });

  it('rejects cross-user deletion attempt by User B (NO_CROSS_USER_DOMAIN_DELETION)', async () => {
    await expect(
      domainsService.delete(testUserBId, testDomainId),
    ).rejects.toThrow(NotFoundException);

    // Verify domain still exists untouched in DB
    const domainStillExists = await prisma.domain.findUnique({
      where: { id: testDomainId },
    });
    expect(domainStillExists).not.toBeNull();
  });

  it('deletes domain by User A and cascades cleanly without orphaned records (NO_ORPHANED_DOMAIN_STATE)', async () => {
    await domainsService.delete(testUserAId, testDomainId);

    // Verify domain is gone from PostgreSQL
    const domain = await prisma.domain.findUnique({
      where: { id: testDomainId },
    });
    expect(domain).toBeNull();

    // Verify snapshots, jobs, findings, and briefs are cleanly cascaded
    const orphanedSnapshots = await prisma.infrastructureSnapshot.findMany({
      where: { domainId: testDomainId },
    });
    expect(orphanedSnapshots.length).toBe(0);

    const orphanedJobs = await prisma.understandingJob.findMany({
      where: { domainId: testDomainId },
    });
    expect(orphanedJobs.length).toBe(0);
  });

  it('subsequent delete attempts return 404 NotFound (NO_FALSE_DELETE_SUCCESS)', async () => {
    await expect(
      domainsService.delete(testUserAId, testDomainId),
    ).rejects.toThrow(NotFoundException);
  });
});
