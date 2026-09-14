import { WorkspaceAuditService } from './workspace-audit.service';
import { SecurityAuditWriter } from '../../../common/security/security-audit-writer';

describe('WorkspaceAuditService', () => {
  let service: WorkspaceAuditService;

  beforeEach(() => {
    SecurityAuditWriter.reset();
    service = new WorkspaceAuditService();
  });

  it('records workspace mutation event with S09 structure', () => {
    const event = service.recordWorkspaceEvent({
      userId: 'usr-100',
      eventType: 'DOMAIN_CREATED',
      action: 'Registered domain example.com',
      resourceType: 'DOMAIN',
      resourceId: 'dom-123',
      metadata: { domainName: 'example.com' },
    });

    expect(event.eventId).toMatch(/^aud_evt_/);
    expect(event.plane).toBe('WX');
    expect(event.principal.userId).toBe('usr-100');
    expect(event.eventType).toBe('DOMAIN_CREATED');
    expect(event.severity).toBe('INFO');
    expect(event.resource.resourceId).toBe('dom-123');
  });

  it('queries audit logs scoped strictly to the user', () => {
    // Record events for user A
    service.recordWorkspaceEvent({
      userId: 'usr-A',
      eventType: 'DOMAIN_CREATED',
      action: 'Created domain A',
    });
    service.recordWorkspaceEvent({
      userId: 'usr-A',
      eventType: 'DOMAIN_DELETED',
      action: 'Deleted domain A',
    });

    // Record event for user B
    service.recordWorkspaceEvent({
      userId: 'usr-B',
      eventType: 'DOMAIN_CREATED',
      action: 'Created domain B',
    });

    // Query for user A
    const resultA = service.getWorkspaceAuditLogs('usr-A');
    expect(resultA.total).toBe(2);
    expect(resultA.events.every((e) => e.principal.userId === 'usr-A')).toBe(
      true,
    );

    // Query for user B
    const resultB = service.getWorkspaceAuditLogs('usr-B');
    expect(resultB.total).toBe(1);
    expect(resultB.events[0].principal.userId).toBe('usr-B');
  });

  it('filters by eventType and applies pagination', () => {
    service.recordWorkspaceEvent({
      userId: 'usr-C',
      eventType: 'DOMAIN_CREATED',
      action: 'Domain 1',
    });
    service.recordWorkspaceEvent({
      userId: 'usr-C',
      eventType: 'DOMAIN_CREATED',
      action: 'Domain 2',
    });
    service.recordWorkspaceEvent({
      userId: 'usr-C',
      eventType: 'UNDERSTANDING_TRIGGERED',
      action: 'Scan 1',
    });

    const onlyCreated = service.getWorkspaceAuditLogs('usr-C', {
      eventType: 'DOMAIN_CREATED',
    });
    expect(onlyCreated.total).toBe(2);
    expect(onlyCreated.events.length).toBe(2);

    const paginated = service.getWorkspaceAuditLogs('usr-C', {
      limit: 1,
      offset: 1,
    });
    expect(paginated.total).toBe(3);
    expect(paginated.events.length).toBe(1);
    expect(paginated.offset).toBe(1);
  });
});
