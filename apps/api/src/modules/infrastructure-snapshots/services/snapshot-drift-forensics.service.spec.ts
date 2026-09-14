import { NotFoundException } from '@nestjs/common';
import { SnapshotDriftForensicsService } from './snapshot-drift-forensics.service';

describe('SnapshotDriftForensicsService', () => {
  let service: SnapshotDriftForensicsService;
  let prismaMock: any;

  const mockDomain = {
    id: 'dom-123',
    userId: 'user-1',
    domainName: 'atlas-cloud.io',
  };

  const mockBaseSnapshot = {
    id: 'snp-base',
    domainId: 'dom-123',
    createdAt: new Date('2026-09-01T10:00:00Z'),
    payload: {
      dns: {
        a: ['104.21.4.1'],
        ns: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
        cname: ['cname.vercel-dns.com'],
      },
      ssl: {
        issuer: "Let's Encrypt",
        validTo: '2026-12-01T00:00:00Z',
        daysRemaining: 90,
      },
      http: {
        statusCode: 200,
        headers: {
          'content-security-policy': "default-src 'self'",
          'strict-transport-security': 'max-age=31536000',
          'x-request-id': 'req-base-123',
          'cf-ray': 'ray-base-123',
        },
      },
      technology: {
        technologies: [
          { name: 'Cloudflare', version: '' },
          { name: 'Next.js', version: '14.2.0' },
        ],
      },
    },
  };

  const mockTargetSnapshot = {
    id: 'snp-target',
    domainId: 'dom-123',
    createdAt: new Date('2026-09-06T10:00:00Z'),
    payload: {
      dns: {
        a: ['172.67.182.5'],
        ns: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
        cname: ['cname.vercel-dns.com'],
      },
      ssl: {
        issuer: "Let's Encrypt",
        validTo: '2026-12-01T00:00:00Z',
        daysRemaining: 85,
      },
      http: {
        statusCode: 200,
        headers: {
          'strict-transport-security': 'max-age=31536000', // CSP removed!
          'x-request-id': 'req-target-456',
          'cf-ray': 'ray-target-456',
        },
      },
      technology: {
        technologies: [
          { name: 'Cloudflare', version: '' },
          { name: 'Next.js', version: '14.2.0' },
          { name: 'Tailwind CSS', version: '3.4.0' }, // Added!
        ],
      },
    },
  };

  beforeEach(() => {
    prismaMock = {
      domain: {
        findFirst: jest.fn().mockResolvedValue(mockDomain),
      },
      infrastructureSnapshot: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'snp-base') return Promise.resolve(mockBaseSnapshot);
          if (where.id === 'snp-target')
            return Promise.resolve(mockTargetSnapshot);
          if (where.createdAt?.lt) return Promise.resolve(mockBaseSnapshot);
          return Promise.resolve(null);
        }),
      },
    };

    service = new SnapshotDriftForensicsService(prismaMock);
  });

  it('computes accurate DNS, HTTP, and Technology drift between snapshots', async () => {
    const result = await service.computeSnapshotDrift(
      'user-1',
      'dom-123',
      'snp-target',
      'snp-base',
    );

    expect(result.domainId).toBe('dom-123');
    expect(result.domainName).toBe('atlas-cloud.io');
    expect(result.hasMeaningfulDrift).toBe(true);

    // DNS Drift
    expect(result.dns.ipShiftDetected).toBe(true);
    expect(result.dns.nameserverShiftDetected).toBe(false);

    // HTTP Drift & Header Noise Suppression
    expect(result.http.noiseHeadersSuppressed).toBeGreaterThan(0);
    const cspRemoval = result.http.changes.find(
      (c) => c.field === 'Header: content-security-policy',
    );
    expect(cspRemoval).toBeDefined();
    expect(cspRemoval?.type).toBe('REMOVED');

    // Tech Drift
    expect(result.technology.addedTechnologies).toContain('Tailwind CSS');

    // Risk calculation
    expect(result.driftScore).toBeGreaterThan(0);
    expect(['MODERATE', 'HIGH', 'CRITICAL']).toContain(result.riskLevel);
  });

  it('automatically resolves previous snapshot when baseSnapshotId is omitted', async () => {
    const result = await service.computeSnapshotDrift(
      'user-1',
      'dom-123',
      'snp-target',
    );

    expect(prismaMock.infrastructureSnapshot.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          domainId: 'dom-123',
        }),
      }),
    );
    expect(result.baseSnapshotId).toBe('snp-base');
  });

  it('throws NotFoundException if domain does not belong to the user', async () => {
    prismaMock.domain.findFirst.mockResolvedValue(null);

    await expect(
      service.computeSnapshotDrift(
        'unauthorized-user',
        'dom-123',
        'snp-target',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
