import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SearchRepository } from './search.repository';

describe('SearchRepository', () => {
  let repository: SearchRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockDomain = {
    id: 'dom-1',
    userId: 'user-1',
    domainName: 'github.com',
    createdAt: new Date(),
  };

  const mockFinding = {
    id: 'fnd-1',
    snapshotId: 'snp-1',
    ruleId: 'http.missing-hsts',
    title: 'Missing HSTS Header',
    description: 'Strict-Transport-Security header is absent.',
    severity: 'HIGH',
    category: 'SECURITY_HEADER',
    createdAt: new Date(),
    snapshot: {
      domainId: 'dom-1',
      domain: mockDomain,
    },
  };

  const mockChange = {
    id: 'chg-1',
    domainId: 'dom-1',
    title: 'TLS Configuration Updated',
    description: 'Upgraded to TLS 1.3',
    changeType: 'MODIFIED',
    severity: 'LOW',
    module: 'SSL',
    category: 'TLS',
    detectedAt: new Date(),
    domain: mockDomain,
  };

  const mockSnapshot = {
    id: 'snp-1',
    domainId: 'dom-1',
    httpStatus: 200,
    responseTimeMs: 120,
    payload: {
      http: { headers: { server: 'nginx/1.24.0' } },
      technology: {
        technologies: [{ name: 'React', categories: ['Frontend'] }],
      },
      dns: { a: ['20.207.73.82'] },
      ssl: {
        authorized: true,
        certificate: { issuer: { O: "Let's Encrypt" } },
      },
    },
    createdAt: new Date(),
    domain: mockDomain,
  };

  const mockBrief = {
    id: 'brf-1',
    snapshotId: 'snp-1',
    overallHealth: 'HEALTHY',
    summary: 'Infrastructure is secure with zero critical issues.',
    snapshot: {
      domainId: 'dom-1',
      domain: mockDomain,
    },
  };

  const mockVerification = {
    id: 'ver-1',
    domainId: 'dom-1',
    changeDetected: true,
    domain: mockDomain,
  };

  beforeEach(() => {
    prisma = {
      domain: {
        findFirst: jest.fn().mockResolvedValue(mockDomain),
        findMany: jest.fn().mockResolvedValue([mockDomain]),
      },
      infrastructureFinding: {
        findMany: jest.fn().mockResolvedValue([mockFinding]),
      },
      changeHistory: {
        findMany: jest.fn().mockResolvedValue([mockChange]),
      },
      infrastructureSnapshot: {
        findMany: jest.fn().mockResolvedValue([mockSnapshot]),
      },
      infrastructureBrief: {
        findMany: jest.fn().mockResolvedValue([mockBrief]),
      },
      infrastructureVerification: {
        findMany: jest.fn().mockResolvedValue([mockVerification]),
      },
    } as unknown as jest.Mocked<PrismaService>;

    repository = new SearchRepository(prisma);
  });

  it('should return empty array if query is empty or whitespace', async () => {
    const res1 = await repository.executeSearch('user-1', '');
    const res2 = await repository.executeSearch('user-1', '   ');
    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  it('should retrieve matching domains, findings, changes, infra, briefs, and activity', async () => {
    const results = await repository.executeSearch('user-1', 'github');
    expect(results.length).toBeGreaterThan(0);

    const domainItem = results.find((r) => r.type === 'DOMAIN');
    expect(domainItem).toBeDefined();
    expect(domainItem?.title).toBe('github.com');
    expect(domainItem?.domainName).toBe('github.com');
    expect(domainItem?.destination).toBe('/workspace?domainId=dom-1');

    const findingItem = results.find((r) => r.type === 'FINDING');
    expect(findingItem).toBeDefined();
    expect(findingItem?.destination).toContain('sourceType=finding');

    const changeItem = results.find((r) => r.type === 'CHANGE');
    expect(changeItem).toBeDefined();
    expect(changeItem?.destination).toContain('sourceType=change');

    const infraItem = results.find((r) => r.type === 'INFRASTRUCTURE');
    expect(infraItem).toBeDefined();
  });

  it('should extract infrastructure entities from snapshot payload', async () => {
    const results = await repository.executeSearch('user-1', 'nginx');
    const serverResult = results.find(
      (r) => r.type === 'INFRASTRUCTURE' && r.title.includes('nginx'),
    );
    expect(serverResult).toBeDefined();
    expect(serverResult?.subtitle).toContain('Web Server');
  });

  it('should enforce cross-tenant isolation and reject unauthorized domainId scope', async () => {
    prisma.domain.findFirst.mockResolvedValue(null); // Not owned by user-1

    const results = await repository.executeSearch('user-1', 'github', {
      domainId: 'unauthorized-domain-id',
    });
    expect(results).toEqual([]);
    expect(prisma.domain.findMany).not.toHaveBeenCalled();
  });

  it('should scope search to domainId when valid and owned', async () => {
    prisma.domain.findFirst.mockResolvedValue(mockDomain);

    await repository.executeSearch('user-1', 'github', { domainId: 'dom-1' });
    expect(prisma.domain.findFirst).toHaveBeenCalledWith({
      where: { id: 'dom-1', userId: 'user-1' },
      select: { id: true },
    });
    expect(prisma.domain.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'dom-1', userId: 'user-1' }),
      }),
    );
  });

  it('should only query findings when type=FINDING is specified', async () => {
    await repository.executeSearch('user-1', 'header', { type: 'FINDING' });
    expect(prisma.infrastructureFinding.findMany).toHaveBeenCalled();
    expect(prisma.domain.findMany).not.toHaveBeenCalled();
    expect(prisma.changeHistory.findMany).not.toHaveBeenCalled();
  });

  it('should apply severity and timeRange filters to finding queries', async () => {
    await repository.executeSearch('user-1', 'hsts', {
      type: 'FINDING',
      severity: 'HIGH',
      timeRange: '7d',
    });
    expect(prisma.infrastructureFinding.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          severity: 'HIGH',
          createdAt: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      }),
    );
  });
});
