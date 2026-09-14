import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { InfrastructureBriefService } from '../infrastructure-brief/services/infrastructure-brief.service';
import { SecurityBriefBuilder } from '../infrastructure-brief/builders/security-brief.builder';
import { InfrastructureFindingService } from '../infrastructure-findings/services/infrastructure-finding.service';
import { TimelineExperienceService } from '../timeline/services/timeline-experience.service';
import { WorkspaceController } from './controllers/workspace.controller';
import { WorkspaceExperienceService } from './services/workspace-experience.service';
import { WorkspaceQueryService } from './services/workspace-query.service';

describe('Workspace Security Experience API (Securities Tab)', () => {
  let controller: WorkspaceController;
  let workspaceExperienceService: WorkspaceExperienceService;
  let prismaService: any;
  let briefService: any;
  let findingService: any;
  let timelineService: any;

  const mockUser = {
    id: 'usr-123',
    fullName: 'Jane Security Lead',
    email: 'jane@enterprise.org',
  };

  beforeEach(async () => {
    prismaService = {
      domain: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'dom-sec-1',
          userId: 'usr-123',
          domainName: 'atlas-cloud.io',
          monitoringEnabled: true,
          createdAt: new Date('2026-08-01T00:00:00Z'),
          updatedAt: new Date('2026-08-01T00:00:00Z'),
        }),
      },
      infrastructureSnapshot: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'snp-sec-1',
          domainId: 'dom-sec-1',
          domainName: 'atlas-cloud.io',
          createdAt: new Date('2026-08-29T12:00:00Z'),
          payload: {
            domain: 'atlas-cloud.io',
            ssl: {
              valid: true,
              protocol: 'TLSv1.3',
              certificate: {
                validTo: new Date(
                  Date.now() + 90 * 24 * 60 * 60 * 1000,
                ).toISOString(),
              },
            },
            http: {
              statusCode: 200,
              headers: {
                'strict-transport-security':
                  'max-age=31536000; includeSubDomains; preload',
                'content-security-policy': "default-src 'self'",
              },
            },
          },
        }),
      },
    };

    findingService = {
      getFindingsExperienceList: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'f-tls-1',
            ruleId: 'tls.modern-tls-upgrade-opportunity',
            title: 'Modern TLS Ingress Configured',
            description: 'TLS 1.3 is actively negotiated',
            severity: 'LOW',
            category: 'TLS',
            status: 'ACTIVE',
            state: 'ACTIVE',
            createdAt: new Date('2026-08-29T12:00:00Z'),
          },
        ],
        pagination: { total: 1, page: 1, limit: 50, totalPages: 1 },
      }),
    };

    briefService = {
      generateForUser: jest.fn(),
    };

    timelineService = {
      getTimelineData: jest.fn().mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceController],
      providers: [
        WorkspaceExperienceService,
        SecurityBriefBuilder,
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

  it('1. Returns authoritative Security Overview with Security Brief and 7 Pillars', async () => {
    const req = { user: mockUser } as any;
    const result = await controller.getWorkspaceSecurity(req, 'dom-sec-1');

    expect(result).toBeDefined();
    expect(result.domainId).toBe('dom-sec-1');
    expect(result.domainName).toBe('atlas-cloud.io');
    expect(result.securityScore).toBeGreaterThanOrEqual(95);
    expect(result.securityGrade).toBe('A+');
    expect(result.posture).toBe('HARDENED');
    expect(result.securityBrief).toBeDefined();
    expect(result.securityBrief.securitySummary).toContain('atlas-cloud.io');
    expect(result.securityPillars).toHaveLength(7);
    expect(result.securityFindings).toHaveLength(1);
    expect(result.securityFindings[0].ruleId).toBe(
      'tls.modern-tls-upgrade-opportunity',
    );
  });

  it('2. Enforces strict domain ownership and throws 404 for unowned domain', async () => {
    prismaService.domain.findFirst.mockResolvedValue(null);
    const req = { user: mockUser } as any;

    await expect(
      controller.getWorkspaceSecurity(req, 'unowned-domain'),
    ).rejects.toThrow(NotFoundException);
  });
});
