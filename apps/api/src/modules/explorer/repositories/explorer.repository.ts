import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ExplorerQueryDto } from '../dto/explorer-query.dto';
import { InfrastructureAssetDto } from '../dto/infrastructure-asset.dto';

@Injectable()
export class ExplorerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserAssets(
    userId: string,
    query: ExplorerQueryDto,
  ): Promise<{
    data: InfrastructureAssetDto[];
    total: number;
  }> {
    const [domains, snapshots] = await Promise.all([
      this.prisma.domain.findMany({
        where: {
          userId,
          ...(query.domainId ? { id: query.domainId } : {}),
        },
      }),
      this.prisma.infrastructureSnapshot.findMany({
        where: {
          domain: {
            userId,
            ...(query.domainId ? { id: query.domainId } : {}),
          },
        },
        include: {
          domain: {
            select: {
              id: true,
              domainName: true,
            },
          },
          findings: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const allAssets: InfrastructureAssetDto[] = [];
    const seenAssetIds = new Set<string>();

    // 0. Domain Assets
    for (const dom of domains) {
      const domAssetId = `dom-${dom.id}`;
      if (!seenAssetIds.has(domAssetId)) {
        seenAssetIds.add(domAssetId);
        allAssets.push({
          assetId: domAssetId,
          category: 'Domain',
          name: dom.domainName,
          value: dom.domainName,
          status: dom.monitoringEnabled ? 'ACTIVE' : 'INACTIVE',
          confidence: 'CERTAIN',
          firstObserved: dom.createdAt,
          lastObserved: dom.createdAt,
          currentSnapshotId: null,
          sourcePlugin: 'domain-discovery',
          knowledgePlugin: 'domain-knowledge',
          evidenceCount: 1,
          findingCount: 0,
        });
      }
    }

    // 1-5. Snapshot Assets
    for (const snap of snapshots) {
      const payload: any = snap.payload || {};
      const domainName = snap.domain.domainName;

      // 1. Web Server Asset
      if (payload.webServer) {
        const srvAssetId = `ast-srv-${snap.domainId}-${payload.webServer}`;
        if (!seenAssetIds.has(srvAssetId)) {
          seenAssetIds.add(srvAssetId);
          allAssets.push({
            assetId: srvAssetId,
            category: 'Infrastructure Services',
            name: `Web Server (${payload.webServer})`,
            value: payload.webServer,
            status: 'ACTIVE',
            confidence: 'CERTAIN',
            firstObserved: snap.createdAt,
            lastObserved: snap.createdAt,
            currentSnapshotId: snap.id,
            sourcePlugin: 'http-discovery',
            knowledgePlugin: 'http-knowledge',
            evidenceCount: 1,
            findingCount: snap.findings.filter((f) => f.category === 'GENERAL')
              .length,
          });
        }
      }

      // 2. IPv4 Addresses (DNS)
      if (Array.isArray(payload.ipv4Addresses)) {
        for (const ip of payload.ipv4Addresses) {
          const ipAssetId = `ast-dns-v4-${snap.domainId}-${ip}`;
          if (!seenAssetIds.has(ipAssetId)) {
            seenAssetIds.add(ipAssetId);
            allAssets.push({
              assetId: ipAssetId,
              category: 'DNS',
              name: `A Record (${ip})`,
              value: ip,
              status: 'ACTIVE',
              confidence: 'CERTAIN',
              firstObserved: snap.createdAt,
              lastObserved: snap.createdAt,
              currentSnapshotId: snap.id,
              sourcePlugin: 'dns-discovery',
              knowledgePlugin: 'dns-knowledge',
              evidenceCount: 1,
              findingCount: snap.findings.filter(
                (f) => f.category === 'DNS_RECORD',
              ).length,
            });
          }
        }
      }

      // 3. TLS Certificate
      if (payload.sslValid !== undefined) {
        const tlsAssetId = `ast-tls-${snap.domainId}`;
        if (!seenAssetIds.has(tlsAssetId)) {
          seenAssetIds.add(tlsAssetId);
          allAssets.push({
            assetId: tlsAssetId,
            category: 'Certificates',
            name: `TLS Certificate (${domainName})`,
            value: payload.sslValid ? 'Valid SSL/TLS' : 'Invalid Certificate',
            status: payload.sslValid ? 'ACTIVE' : 'DEPRECATED',
            confidence: 'CERTAIN',
            firstObserved: snap.createdAt,
            lastObserved: snap.createdAt,
            currentSnapshotId: snap.id,
            sourcePlugin: 'tls-discovery',
            knowledgePlugin: 'tls-knowledge',
            evidenceCount: 1,
            findingCount: snap.findings.filter(
              (f) => f.category === 'CERTIFICATE' || f.category === 'TLS',
            ).length,
          });
        }
      }

      // 4. Security Headers
      const secAssetId = `ast-sec-${snap.domainId}-hsts`;
      if (!seenAssetIds.has(secAssetId)) {
        seenAssetIds.add(secAssetId);
        allAssets.push({
          assetId: secAssetId,
          category: 'Security Headers',
          name: 'Strict-Transport-Security Header',
          value:
            payload.hstsHeader ||
            (payload.headers?.['strict-transport-security']
              ? 'PRESENT'
              : 'MISSING'),
          status:
            payload.hstsHeader || payload.headers?.['strict-transport-security']
              ? 'ACTIVE'
              : 'INACTIVE',
          confidence: 'CERTAIN',
          firstObserved: snap.createdAt,
          lastObserved: snap.createdAt,
          currentSnapshotId: snap.id,
          sourcePlugin: 'http-discovery',
          knowledgePlugin: 'http-knowledge',
          evidenceCount: 1,
          findingCount: snap.findings.filter((f) => f.ruleId.includes('hsts'))
            .length,
        });
      }

      // 5. Detected Platforms / Technologies
      if (Array.isArray(payload.technologies)) {
        for (const tech of payload.technologies) {
          const techName =
            typeof tech === 'string' ? tech : tech.name || 'Unknown';
          const techVal =
            typeof tech === 'string'
              ? tech
              : tech.version || tech.name || 'Unknown';
          const techAssetId = `ast-tech-${snap.domainId}-${techName}`;
          if (!seenAssetIds.has(techAssetId)) {
            seenAssetIds.add(techAssetId);
            allAssets.push({
              assetId: techAssetId,
              category: 'Technologies',
              name: techName,
              value: techVal,
              status: 'ACTIVE',
              confidence: 'CERTAIN',
              firstObserved: snap.createdAt,
              lastObserved: snap.createdAt,
              currentSnapshotId: snap.id,
              sourcePlugin: 'tech-discovery',
              knowledgePlugin: 'tech-knowledge',
              evidenceCount: 1,
              findingCount: snap.findings.filter(
                (f) => f.category === 'TECHNOLOGY',
              ).length,
            });
          }
        }
      }
    }

    // Apply filtering
    let filtered = allAssets;

    if (query.category) {
      filtered = filtered.filter(
        (a) => a.category.toLowerCase() === query.category!.toLowerCase(),
      );
    }

    if (query.confidence) {
      filtered = filtered.filter(
        (a) => a.confidence.toLowerCase() === query.confidence!.toLowerCase(),
      );
    }

    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(s) || a.value.toLowerCase().includes(s),
      );
    }

    const total = filtered.length;
    const page = query.page || 1;
    const limit = query.limit || 20;

    const data = filtered.slice((page - 1) * limit, page * limit);

    return { data, total };
  }

  async findAssetById(
    userId: string,
    assetId: string,
  ): Promise<InfrastructureAssetDto | null> {
    const res = await this.findUserAssets(userId, { limit: 1000, page: 1 });
    const directMatch = res.data.find((a) => a.assetId === assetId);
    if (directMatch) return directMatch;

    // Fuzzy or prefix match for assets belonging to user's domain
    const fuzzyMatch = res.data.find(
      (a) =>
        assetId.includes(a.assetId) ||
        a.assetId.includes(assetId) ||
        assetId.endsWith(a.name.toLowerCase()),
    );

    return fuzzyMatch || null;
  }

  async findRawEvidenceForUser(userId: string) {
    return this.prisma.rawEvidence.findMany({
      where: { domain: { userId } },
      orderBy: { capturedAt: 'desc' },
      take: 10,
    });
  }

  async findTimelineForUser(userId: string) {
    return this.prisma.changeHistory.findMany({
      where: { domain: { userId } },
      orderBy: { detectedAt: 'desc' },
      take: 10,
    });
  }

  async findFindingsForUser(userId: string) {
    return this.prisma.infrastructureFinding.findMany({
      where: { snapshot: { domain: { userId } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}
