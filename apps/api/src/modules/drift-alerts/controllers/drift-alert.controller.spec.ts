import { Test, TestingModule } from '@nestjs/testing';
import { DriftAlertController } from './drift-alert.controller';
import { DriftAlertService } from '../services/drift-alert.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WorkspacePermissionGuard } from '../../../common/security/rbac/workspace-permission.guard';
import { DriftAlertDto } from '../dto/drift-alert.dto';

describe('DriftAlertController', () => {
  let controller: DriftAlertController;
  let mockDriftAlertService: any;

  const mockAlert: DriftAlertDto = {
    id: 'alert_12345',
    domainId: 'dom-001',
    domainName: 'test.com',
    snapshotId: 'snp-002',
    driftScore: 80,
    riskLevel: 'HIGH',
    status: 'ACTIVE',
    category: 'DNS',
    title: 'DNS Changed',
    summary: 'Nameserver changed',
    forensicNarrative: ['NS changed'],
    changes: [],
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockDriftAlertService = {
      getAlertsByDomain: jest.fn().mockResolvedValue([mockAlert]),
      getWorkspaceAlerts: jest.fn().mockResolvedValue([mockAlert]),
      acknowledgeAlert: jest
        .fn()
        .mockResolvedValue({ ...mockAlert, status: 'ACKNOWLEDGED' }),
      resolveAlert: jest
        .fn()
        .mockResolvedValue({ ...mockAlert, status: 'RESOLVED' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriftAlertController],
      providers: [
        { provide: DriftAlertService, useValue: mockDriftAlertService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(WorkspacePermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DriftAlertController>(DriftAlertController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates getDomainAlerts to service with req.user.id', async () => {
    const req = { user: { id: 'usr-123' } } as any;
    const result = await controller.getDomainAlerts(req, 'dom-001');

    expect(result).toEqual([mockAlert]);
    expect(mockDriftAlertService.getAlertsByDomain).toHaveBeenCalledWith(
      'usr-123',
      'dom-001',
    );
  });

  it('delegates getWorkspaceAlerts to service with req.user.id', async () => {
    const req = { user: { id: 'usr-123' } } as any;
    const result = await controller.getWorkspaceAlerts(req);

    expect(result).toEqual([mockAlert]);
    expect(mockDriftAlertService.getWorkspaceAlerts).toHaveBeenCalledWith(
      'usr-123',
    );
  });

  it('delegates acknowledgeAlert to service', async () => {
    const req = { user: { id: 'usr-123' } } as any;
    const result = await controller.acknowledgeAlert(
      req,
      'dom-001',
      'alert_12345',
    );

    expect(result.status).toBe('ACKNOWLEDGED');
    expect(mockDriftAlertService.acknowledgeAlert).toHaveBeenCalledWith(
      'usr-123',
      'dom-001',
      'alert_12345',
    );
  });

  it('delegates resolveAlert to service', async () => {
    const req = { user: { id: 'usr-123' } } as any;
    const result = await controller.resolveAlert(req, 'dom-001', 'alert_12345');

    expect(result.status).toBe('RESOLVED');
    expect(mockDriftAlertService.resolveAlert).toHaveBeenCalledWith(
      'usr-123',
      'dom-001',
      'alert_12345',
    );
  });
});
