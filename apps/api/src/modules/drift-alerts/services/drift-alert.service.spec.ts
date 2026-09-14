import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DriftAlertService } from './drift-alert.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAuditService } from '../../audit/services/workspace-audit.service';
import { SnapshotDriftForensicsResponseDto } from '../../infrastructure-snapshots/dto/snapshot-drift.dto';

describe('DriftAlertService', () => {
  let service: DriftAlertService;
  let mockPrisma: any;
  let mockAudit: any;

  const mockDomain = {
    id: 'dom-drift-001',
    domainName: 'drift-test.com',
    userId: 'usr-owner-001',
  };

  const highDriftResult: SnapshotDriftForensicsResponseDto = {
    baseSnapshotId: 'snp-base',
    targetSnapshotId: 'snp-target',
    domainId: 'dom-drift-001',
    domainName: 'drift-test.com',
    baseCapturedAt: new Date().toISOString(),
    targetCapturedAt: new Date().toISOString(),
    driftScore: 75,
    riskLevel: 'HIGH',
    hasMeaningfulDrift: true,
    totalChangesCount: 2,
    forensicNarrative: ['DNS nameserver changed to external delegator.'],
    dns: {
      changes: [
        {
          field: 'Nameservers (NS)',
          type: 'MODIFIED',
          previousValue: ['ns1.internal.net'],
          currentValue: ['ns1.rogue.org'],
          description: 'Authoritative nameservers altered',
          severity: 'CRITICAL',
        },
      ],
      ipShiftDetected: false,
      nameserverShiftDetected: true,
    },
    tls: {
      changes: [],
      issuerChanged: false,
    },
    http: {
      changes: [],
      noiseHeadersSuppressed: 0,
    },
    technology: {
      changes: [],
      addedTechnologies: [],
      removedTechnologies: [],
    },
  };

  const cleanDriftResult: SnapshotDriftForensicsResponseDto = {
    ...highDriftResult,
    driftScore: 0,
    riskLevel: 'CLEAN',
    hasMeaningfulDrift: false,
    totalChangesCount: 0,
    forensicNarrative: [],
    dns: {
      changes: [],
      ipShiftDetected: false,
      nameserverShiftDetected: false,
    },
  };

  beforeEach(async () => {
    mockPrisma = {
      domain: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (
            where.id === 'dom-drift-001' &&
            where.userId === 'usr-owner-001'
          ) {
            return Promise.resolve(mockDomain);
          }
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where.userId === 'usr-owner-001') {
            return Promise.resolve([mockDomain]);
          }
          return Promise.resolve([]);
        }),
      },
    };

    mockAudit = {
      recordWorkspaceEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriftAlertService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WorkspaceAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<DriftAlertService>(DriftAlertService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateAndTriggerAlerts', () => {
    it('triggers and persists an alert when HIGH/CRITICAL drift or DNS hijack is detected', async () => {
      const alerts = await service.evaluateAndTriggerAlerts(
        'usr-owner-001',
        'dom-drift-001',
        highDriftResult,
      );

      expect(alerts.length).toBe(1);
      const alert = alerts[0];
      expect(alert.domainId).toBe('dom-drift-001');
      expect(alert.category).toBe('DNS');
      expect(alert.riskLevel).toBe('HIGH');
      expect(alert.status).toBe('ACTIVE');
      expect(alert.title).toContain('DNS');
      expect(mockAudit.recordWorkspaceEvent).toHaveBeenCalled();
    });

    it('does not trigger alerts for clean snapshots with 0 risk score', async () => {
      const alerts = await service.evaluateAndTriggerAlerts(
        'usr-owner-001',
        'dom-drift-001',
        cleanDriftResult,
      );

      expect(alerts.length).toBe(0);
    });
  });

  describe('alert querying and lifecycle', () => {
    let triggeredAlertId: string;

    beforeEach(async () => {
      const alerts = await service.evaluateAndTriggerAlerts(
        'usr-owner-001',
        'dom-drift-001',
        highDriftResult,
      );
      triggeredAlertId = alerts[0].id;
    });

    it('retrieves active alerts for domain with tenant isolation', async () => {
      const domainAlerts = await service.getAlertsByDomain(
        'usr-owner-001',
        'dom-drift-001',
      );

      expect(domainAlerts.length).toBe(1);
      expect(domainAlerts[0].id).toBe(triggeredAlertId);

      // Other user cannot query this domain's alerts
      await expect(
        service.getAlertsByDomain('usr-other-002', 'dom-drift-001'),
      ).rejects.toThrow(NotFoundException);
    });

    it('retrieves workspace-wide active drift alerts for authenticated user', async () => {
      const workspaceAlerts = await service.getWorkspaceAlerts('usr-owner-001');
      expect(workspaceAlerts.length).toBe(1);
      expect(workspaceAlerts[0].id).toBe(triggeredAlertId);

      const emptyUserAlerts = await service.getWorkspaceAlerts('usr-other-002');
      expect(emptyUserAlerts.length).toBe(0);
    });

    it('acknowledges an active alert', async () => {
      const acked = await service.acknowledgeAlert(
        'usr-owner-001',
        'dom-drift-001',
        triggeredAlertId,
      );

      expect(acked.status).toBe('ACKNOWLEDGED');
      expect(acked.acknowledgedBy).toBe('usr-owner-001');
      expect(acked.acknowledgedAt).toBeDefined();
    });

    it('resolves an alert', async () => {
      const resolved = await service.resolveAlert(
        'usr-owner-001',
        'dom-drift-001',
        triggeredAlertId,
      );

      expect(resolved.status).toBe('RESOLVED');
    });
  });
});
