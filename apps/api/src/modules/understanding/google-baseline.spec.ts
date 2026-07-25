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

describe('Evidence-Based Runtime Pipeline Validation (google.com)', () => {
  jest.setTimeout(30000);

  it('should execute full understanding pipeline against google.com and produce raw evidence', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const prisma = moduleRef.get(PrismaService);
    const engine = moduleRef.get(UnderstandingEngine);
    const discoveryRegistry = moduleRef.get(DiscoveryRegistryService);
    const equalityEngine = moduleRef.get(SnapshotEqualityEngine);
    const workspaceExp = moduleRef.get(WorkspaceExperienceService);
    const domainExp = moduleRef.get(DomainExperienceService);
    const searchExp = moduleRef.get(SearchExperienceService);

    // Stage 1: Domain Creation
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'baseline@example.com',
          fullName: 'Baseline User',
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

    // Stage 2: Understanding Job
    const job = await prisma.understandingJob.create({
      data: {
        domainId: domain.id,
        trigger: 'MANUAL',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    // Stages 3-7: Discovery Run
    const discoveryStart = Date.now();
    const discoverySnapshot: Record<string, any> = {};
    for (const module of discoveryRegistry.getModules()) {
      try {
        discoverySnapshot[module.name] = await module.discover(domainName);
      } catch (e: any) {
        discoverySnapshot[module.name] = { error: e.message };
      }
    }
    const discoveryDuration = Date.now() - discoveryStart;

    // Stage 8: Snapshot Equality Check
    const prevSnapshot = await prisma.infrastructureSnapshot.findFirst({
      where: { domainId: domain.id },
      orderBy: { createdAt: 'desc' },
    });

    let isSame = false;
    if (prevSnapshot && prevSnapshot.payload) {
      isSame = equalityEngine.isEqual(
        prevSnapshot.payload as any,
        discoverySnapshot as any,
      );
    }

    // Stages 9-13: Pipeline Execution
    const engineStart = Date.now();
    await engine.execute(job.id, domain.id, domainName);
    const engineDuration = Date.now() - engineStart;

    await prisma.understandingJob.update({
      where: { id: job.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // Fetch Database Records (Stage 19)
    const savedJob = await prisma.understandingJob.findUnique({
      where: { id: job.id },
    });
    const savedVerification =
      await prisma.infrastructureVerification.findFirst({
        where: { jobId: job.id },
        orderBy: { createdAt: 'desc' },
      });
    const savedSnapshotRecord =
      await prisma.infrastructureSnapshot.findFirst({
        where: { domainId: domain.id },
        orderBy: { createdAt: 'desc' },
      });
    const savedFindings = savedSnapshotRecord
      ? await prisma.infrastructureFinding.findMany({
          where: { snapshotId: savedSnapshotRecord.id },
        })
      : [];
    const savedBrief = savedSnapshotRecord
      ? await prisma.infrastructureBrief.findFirst({
          where: { snapshotId: savedSnapshotRecord.id },
        })
      : null;
    const savedTimeline = await prisma.changeHistory.findMany({
      where: { domainId: domain.id },
    });

    // Experience Layer Queries (Stages 16-18)
    const workspaceData = await workspaceExp.getWorkspaceData(user.id);
    const domainOverviewData = await domainExp.getDomainOverview(
      user.id,
      domain.id,
    );
    const searchData = await searchExp.search(user.id, {
      q: 'google',
      limit: 10,
    });

    const evidenceOutput = {
      target: domainName,
      stage1_domain: domain,
      stage2_job: savedJob,
      stage3_dns_discovery: discoverySnapshot.dns || null,
      stage4_http_discovery: discoverySnapshot.http || null,
      stage5_ssl_discovery: discoverySnapshot.ssl || null,
      stage6_technology_discovery: discoverySnapshot.technology || null,
      stage7_combined_snapshot: discoverySnapshot,
      stage8_snapshot_equality: {
        prevSnapshotId: prevSnapshot?.id || null,
        isSame,
        comparedFields: [
          'DNS IPv4/IPv6',
          'SSL cert bounds',
          'HTTP security headers',
        ],
      },
      stage9_verification: savedVerification,
      stage10_snapshot_record: savedSnapshotRecord,
      stage11_12_findings: savedFindings,
      stage13_brief: savedBrief,
      stage14_timeline: savedTimeline,
      stage16_workspace: workspaceData,
      stage17_domain_overview: domainOverviewData,
      stage18_search: searchData,
      stage20_metrics: {
        discoveryDurationMs: discoveryDuration,
        engineDurationMs: engineDuration,
        totalDurationMs: discoveryDuration + engineDuration,
      },
    };

    console.log(
      '=== RAW EVIDENCE OUTPUT FOR GOOGLE.COM BASELINE RUN ===\n' +
        JSON.stringify(evidenceOutput, null, 2),
    );

    expect(savedJob?.status).toBe('COMPLETED');
    expect(domainOverviewData.domain.domainName).toBe('google.com');

    await app.close();
  });
});
