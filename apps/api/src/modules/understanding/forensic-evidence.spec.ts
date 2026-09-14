import { Test } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UnderstandingEngine } from './understanding.engine';
import { DiscoveryRegistryService } from '../../infrastructure/discovery/registry/discovery-registry.service';
import { SnapshotEqualityEngine } from './services/snapshot-equality.engine';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { WorkspaceExperienceService } from '../workspace/services/workspace-experience.service';
import { DomainExperienceService } from '../domain-details/services/domain-experience.service';
import { SearchExperienceService } from '../search/services/search-experience.service';

describe('Forensic Runtime Evidence Collection Suite (google.com)', () => {
  jest.setTimeout(45000);

  it('should execute 2 consecutive pipeline runs against google.com and capture forensic evidence', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const prisma = moduleRef.get(PrismaService);
    const engine = moduleRef.get(UnderstandingEngine);
    const discoveryRegistry = moduleRef.get(DiscoveryRegistryService);
    const equalityEngine = moduleRef.get(SnapshotEqualityEngine);
    const ruleEngine = moduleRef.get(FindingRuleEngineService);
    const workspaceExp = moduleRef.get(WorkspaceExperienceService);
    const domainExp = moduleRef.get(DomainExperienceService);
    const searchExp = moduleRef.get(SearchExperienceService);

    // Setup Target Domain
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'forensic@example.com',
          fullName: 'Forensic User',
          passwordHash: '$2b$10$e8p.087.e8p.087.e8p.087.e8p.087.',
        },
      });
    }

    const domainName = 'google.com';
    let domain = await prisma.domain.findFirst({
      where: { userId: user.id, domainName },
    });
    if (!domain) {
      domain = await prisma.domain.create({
        data: {
          userId: user.id,
          domainName,
          monitoringEnabled: true,
        },
      });
    }

    // --- RUN 1 (Initial Pipeline Run) ---
    const run1Job = await prisma.understandingJob.create({
      data: {
        domainId: domain.id,
        trigger: 'MANUAL',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    const run1Start = Date.now();
    await engine.execute(run1Job.id, domain.id, domainName);
    const run1Duration = Date.now() - run1Start;

    await prisma.understandingJob.update({
      where: { id: run1Job.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    const run1Snapshot = await prisma.infrastructureSnapshot.findFirst({
      where: { domainId: domain.id, jobId: run1Job.id },
    });
    const run1Verification = await prisma.infrastructureVerification.findFirst({
      where: { jobId: run1Job.id },
    });

    // --- RUN 2 (Consecutive Run for Deduplication Verification) ---
    const run2Job = await prisma.understandingJob.create({
      data: {
        domainId: domain.id,
        trigger: 'MANUAL',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    const run2Start = Date.now();
    await engine.execute(run2Job.id, domain.id, domainName);
    const run2Duration = Date.now() - run2Start;

    await prisma.understandingJob.update({
      where: { id: run2Job.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    const run2Snapshot = await prisma.infrastructureSnapshot.findFirst({
      where: { domainId: domain.id, jobId: run2Job.id },
    });
    const run2Verification = await prisma.infrastructureVerification.findFirst({
      where: { jobId: run2Job.id },
    });

    const snapshotsTotal = await prisma.infrastructureSnapshot.count({
      where: { domainId: domain.id },
    });
    const verificationsTotal = await prisma.infrastructureVerification.count({
      where: { domainId: domain.id },
    });

    // Rule Engine Trace
    const discoveryPayload = run1Snapshot?.payload as any;
    const ruleTraceResults: any[] = [];
    if (discoveryPayload) {
      const context = {
        domainId: domain.id,
        snapshotId: run1Snapshot.id,
        snapshot: discoveryPayload,
      };
      const evaluatedFindings = await ruleEngine.evaluate(context);
      ruleTraceResults.push(...evaluatedFindings);
    }

    // Queries for forensic package
    const workspaceRes = await workspaceExp.getWorkspaceData(user.id);
    const overviewRes = await domainExp.getDomainOverview(user.id, domain.id);
    const searchRes = await searchExp.search(user.id, {
      q: 'google',
      limit: 10,
    });

    const forensicPackage = {
      target: domainName,
      domainRecord: domain,
      run1: {
        jobId: run1Job.id,
        snapshotCreated: run1Verification?.snapshotCreated,
        snapshotId: run1Snapshot?.id || null,
        verificationId: run1Verification?.id || null,
        durationMs: run1Duration,
      },
      run2: {
        jobId: run2Job.id,
        snapshotCreated: run2Verification?.snapshotCreated,
        changeDetected: run2Verification?.changeDetected,
        snapshotId: run2Snapshot?.id || null,
        verificationId: run2Verification?.id || null,
        durationMs: run2Duration,
        verificationRecord: run2Verification,
      },
      deduplicationEvidence: {
        totalSnapshotsInDb: snapshotsTotal,
        totalVerificationsInDb: verificationsTotal,
      },
      ruleEngineTrace: ruleTraceResults,
      workspaceResponse: workspaceRes,
      domainOverviewResponse: overviewRes,
      searchResponse: searchRes,
    };

    console.log(
      '=== FORENSIC EVIDENCE PACKAGE FOR GOOGLE.COM ===\n' +
        JSON.stringify(forensicPackage, null, 2),
    );

    expect(run1Verification?.id).toBeDefined();
    expect(run2Verification?.id).toBeDefined();
    expect(snapshotsTotal).toBeGreaterThanOrEqual(1);

    await app.close();
  });
});
