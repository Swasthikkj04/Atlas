import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { InfrastructureBriefService } from '../infrastructure-brief/services/infrastructure-brief.service';
import { InfrastructureFindingService } from '../infrastructure-findings/services/infrastructure-finding.service';
import { TimelineExperienceService } from '../timeline/services/timeline-experience.service';
import { WorkspaceController } from './controllers/workspace.controller';
import { WorkspaceExperienceService } from './services/workspace-experience.service';
import { WorkspaceQueryService } from './services/workspace-query.service';

describe('WX-210-R2: Workspace Current Intelligence API Alignment', () => {
  let controller: WorkspaceController;
  let workspaceExperienceService: WorkspaceExperienceService;
  let prismaService: any;
  let briefService: any;
  let findingService: any;
  let timelineService: any;

  const mockUser = {
    id: 'usr-1',
    fullName: 'Jordan Lee',
    email: 'jordan@stripe.com',
  };

  const mockDomain = {
    id: 'dom-1',
    userId: 'usr-1',
    domainName: 'stripe.com',
    status: 'ACTIVE',
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-20T00:00:00Z'),
  };

  const mockSnapshot = {
    id: 'snp-1',
    domainId: 'dom-1',
    responseTimeMs: 120,
    httpStatus: 200,
    createdAt: new Date('2026-08-20T12:00:00Z'),
    payload: {
      technologies: [{ name: 'React' }],
    },
  };

  const mockBrief = {
    id: 'brief-1',
    snapshotId: 'snp-1',
    summary:
      'Infrastructure is operating normally with 1 critical certificate renewal required.',
    highlights: [
      {
        id: 'hl-1',
        title: 'TLS Certificate Expiring Soon',
        summary: 'Approaching expiry in 14 days.',
        severity: 'HIGH',
      },
    ],
    createdAt: new Date('2026-08-20T12:00:00Z'),
  };

  const mockFindings = [
    {
      id: 'find-1',
      domainId: 'dom-1',
      ruleId: 'rule-tls-expiring',
      title: 'TLS Certificate Approaching Expiration',
      severity: 'HIGH',
      category: 'SECURITY',
      state: 'OPEN',
      summary: 'Certificate expires on November 12, 2026.',
      description: 'Your TLS certificate is approaching renewal.',
      remediation: 'Renew certificate before expiry.',
      firstSeenAt: '2026-08-01T00:00:00Z',
      lastObservedAt: '2026-08-20T12:00:00Z',
    },
    {
      id: 'find-2',
      domainId: 'dom-1',
      ruleId: 'rule-dns-change',
      title: 'DNS Configuration Changed',
      severity: 'LOW',
      category: 'INFRASTRUCTURE',
      state: 'OPEN',
      summary: 'Nameserver added.',
      description: 'DNS configuration change observed.',
      remediation: 'Verify nameserver authority.',
      firstSeenAt: '2026-08-05T00:00:00Z',
      lastObservedAt: '2026-08-20T12:00:00Z',
    },
  ];

  beforeEach(async () => {
    prismaService = {
      domain: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'dom-1' && where.userId === 'usr-1') {
            return Promise.resolve(mockDomain);
          }
          return Promise.resolve(null);
        }),
      },
      infrastructureSnapshot: {
        findFirst: jest.fn().mockResolvedValue(mockSnapshot),
      },
      infrastructureBrief: {
        findUnique: jest.fn().mockResolvedValue(mockBrief),
      },
    };

    briefService = {
      generateForUser: jest.fn().mockResolvedValue(mockBrief),
    };

    findingService = {
      getFindingsExperienceList: jest.fn().mockResolvedValue({
        data: mockFindings,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      }),
    };

    timelineService = {
      getTimelineData: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'evt-1',
            timestamp: new Date('2026-08-20T12:00:00Z'),
            domainId: 'dom-1',
            domainName: 'stripe.com',
            title: 'TLS Certificate Renewed',
            changeType: 'MODIFIED',
            severity: 'HIGH',
            category: 'CERTIFICATE',
            summary: 'TLS Certificate Renewed',
            impact: 'Security baseline verified',
          },
        ],
        pagination: { total: 1, page: 1, limit: 5, totalPages: 1 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceController],
      providers: [
        WorkspaceExperienceService,
        { provide: WorkspaceQueryService, useValue: {} },
        { provide: PrismaService, useValue: prismaService },
        { provide: InfrastructureBriefService, useValue: briefService },
        { provide: InfrastructureFindingService, useValue: findingService },
        { provide: TimelineExperienceService, useValue: timelineService },
      ],
    }).compile();

    controller = module.get<WorkspaceController>(WorkspaceController);
    workspaceExperienceService = module.get<WorkspaceExperienceService>(
      WorkspaceExperienceService,
    );
  });

  it('1. Returns synthesized WorkspaceOverviewDto with Executive Brief, Primary Story, and Secondary Stories', async () => {
    const req = { user: mockUser } as any;
    const result = await controller.getWorkspaceOverview(req, 'dom-1');

    expect(result).toBeDefined();
    expect(result.domain.domainName).toBe('stripe.com');
    expect(result.executiveBrief).toBeDefined();
    expect(result.executiveBrief.executiveSummary).toContain(
      'Infrastructure is operating normally',
    );
    expect(result.executiveBrief.highlights).toHaveLength(1);
    expect(result.primaryStory).toBeDefined();
    expect(result.primaryStory.id).toBe('find-1');
    expect(result.primaryStory.severity).toBe('HIGH');
    expect(result.secondaryStories).toHaveLength(1);
    expect(result.secondaryStories[0].id).toBe('find-2');
    expect(result.quietStatus.isQuiet).toBe(false);
  });

  it('2. Enforces strict domain ownership and throws 404 for unowned domain', async () => {
    const req = { user: mockUser } as any;
    await expect(
      controller.getWorkspaceOverview(req, 'dom-unowned-999'),
    ).rejects.toThrow(NotFoundException);
  });

  it('3. Auto-generates brief when snapshot exists without an existing brief record', async () => {
    prismaService.infrastructureBrief.findUnique.mockResolvedValueOnce(null);

    const req = { user: mockUser } as any;
    const result = await controller.getWorkspaceOverview(req, 'dom-1');

    expect(briefService.generateForUser).toHaveBeenCalledWith('usr-1', 'snp-1');
    expect(result.executiveBrief).toBeDefined();
  });

  describe('WX-303: Investigation Related Evidence Deduplication & Primary Exclusion', () => {
    it('4. Guarantees primary investigation entity never appears in secondary stories (Primary Exclusion)', async () => {
      const duplicateWithPrimary = [
        {
          id: 'find-primary',
          domainId: 'dom-1',
          title: 'Wildcard TLS Certificate Expiring in 48 Hours',
          severity: 'CRITICAL',
          category: 'SECURITY',
          createdAt: '2026-08-20T12:00:00Z',
        },
        {
          id: 'find-secondary-1',
          domainId: 'dom-1',
          title: 'HSTS Header Missing',
          severity: 'HIGH',
          category: 'SECURITY',
          createdAt: '2026-08-20T11:00:00Z',
        },
        {
          // Intentional duplicate of primary finding with different title/description
          id: 'find-primary',
          domainId: 'dom-1',
          title: 'Duplicate Primary Instance',
          severity: 'CRITICAL',
          category: 'SECURITY',
          createdAt: '2026-08-20T10:00:00Z',
        },
        {
          // Intentional duplicate of secondary finding
          id: 'find-secondary-1',
          domainId: 'dom-1',
          title: 'HSTS Header Missing Alternate Scan',
          severity: 'HIGH',
          category: 'SECURITY',
          createdAt: '2026-08-20T09:00:00Z',
        },
      ];

      findingService.getFindingsExperienceList.mockResolvedValueOnce({
        data: duplicateWithPrimary,
        meta: { total: 4, page: 1, limit: 20, totalPages: 1 },
      });

      const req = { user: mockUser } as any;
      const result = await controller.getWorkspaceOverview(req, 'dom-1');

      expect(result.primaryStory).toBeDefined();
      expect(result.primaryStory.id).toBe('find-primary');

      // Primary exclusion: secondaryStories MUST NOT contain find-primary
      const containsPrimaryInSecondary = result.secondaryStories.some(
        (s: any) => s.id === 'find-primary',
      );
      expect(containsPrimaryInSecondary).toBe(false);

      // Identity deduplication: secondaryStories has find-secondary-1 exactly once
      expect(result.secondaryStories).toHaveLength(1);
      expect(result.secondaryStories[0].id).toBe('find-secondary-1');
    });

    it('5. Deduplicates strictly using type + canonicalId (not title or description)', () => {
      const itemsWithSameTitle = [
        { id: 'fnd-1', title: 'DNS Failure', severity: 'HIGH' },
        { id: 'fnd-2', title: 'DNS Failure', severity: 'HIGH' }, // Same title, different ID -> valid distinct entities
        { id: 'fnd-1', title: 'Completely Different Description', severity: 'HIGH' }, // Same ID -> duplicate
      ];

      const deduplicated = workspaceExperienceService.deduplicateByIdentity(
        'FINDING',
        itemsWithSameTitle,
      );

      expect(deduplicated).toHaveLength(2);
      expect(deduplicated.map((d) => d.id)).toEqual(['fnd-1', 'fnd-2']);
      // Preserved original first occurrence
      expect(deduplicated[0].title).toBe('DNS Failure');
    });

    it('6. Multiple retrieval paths cannot produce duplicate entities in recent activity', async () => {
      const queryService = new WorkspaceQueryService(
        prismaService,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
      );

      prismaService.domain = {
        findMany: jest.fn().mockResolvedValue([mockDomain]),
      };
      prismaService.changeHistory = {
        findMany: jest.fn().mockResolvedValue([
          { id: 'chg-1', domainId: 'dom-1', title: 'A Record Added', detectedAt: new Date() },
          { id: 'chg-1', domainId: 'dom-1', title: 'A Record Added (Duplicate)', detectedAt: new Date() },
        ]),
      };
      prismaService.infrastructureVerification = {
        findMany: jest.fn().mockResolvedValue([
          { id: 'ver-1', domainId: 'dom-1', createdAt: new Date() },
          { id: 'ver-1', domainId: 'dom-1', createdAt: new Date() },
        ]),
      };
      prismaService.understandingJob = {
        findMany: jest.fn().mockResolvedValue([]),
      };
      prismaService.infrastructureFinding = {
        findMany: jest.fn().mockResolvedValue([]),
      };

      const activity = await queryService.buildRecentActivity('usr-1');

      // Verify each entity type appears at most once per canonicalId
      const changeEvents = activity.filter((a) => a.type === 'INFRASTRUCTURE_CHANGED');
      const verifEvents = activity.filter((a) => a.type === 'EVIDENCE_COLLECTED');

      expect(changeEvents).toHaveLength(1);
      expect(verifEvents).toHaveLength(1);
    });
  });
});
