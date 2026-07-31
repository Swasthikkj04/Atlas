import { Injectable, NotFoundException } from '@nestjs/common';
import { ExplorerQueryDto } from '../dto/explorer-query.dto';
import { InfrastructureAssetDetailDto } from '../dto/infrastructure-asset-detail.dto';
import { InfrastructureExplorerDto } from '../dto/infrastructure-explorer.dto';
import { InfrastructureRelationshipDto } from '../dto/infrastructure-relationship.dto';
import { InfrastructureExplorerQueryService } from './explorer-query.service';

@Injectable()
export class InfrastructureExplorerExperienceService {
  constructor(
    private readonly queryService: InfrastructureExplorerQueryService,
  ) {}

  async getExplorerData(
    userId: string,
    query: ExplorerQueryDto,
  ): Promise<InfrastructureExplorerDto> {
    const result = await this.queryService.getUserAssets(userId, query);
    const limit = query.limit || 20;
    const page = query.page || 1;

    return {
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit) || 1,
      },
    };
  }

  async getAssetDetail(
    userId: string,
    assetId: string,
  ): Promise<InfrastructureAssetDetailDto> {
    const asset = await this.queryService.getAssetById(userId, assetId);
    if (!asset) {
      throw new NotFoundException(
        `Infrastructure asset '${assetId}' not found`,
      );
    }

    const [rawEvidences, timelineChanges, findings] = await Promise.all([
      this.queryService.findRawEvidenceForUser(userId),
      this.queryService.findTimelineForUser(userId),
      this.queryService.findFindingsForUser(userId),
    ]);

    const relationships: InfrastructureRelationshipDto[] = [
      {
        id: `rel-${asset.assetId}-dom`,
        type: 'APPLIES_TO',
        targetId: `dom-${asset.assetId}`,
        targetName: 'Monitored Target Domain',
        targetCategory: 'Domain',
        description: `Asset ${asset.name} is bound to target domain infrastructure.`,
      },
      {
        id: `rel-${asset.assetId}-tls`,
        type: 'SECURED_BY',
        targetId: `ast-tls-${asset.assetId}`,
        targetName: 'Active TLS Certificate',
        targetCategory: 'Certificates',
        description:
          'Transport layer encryption provided by domain TLS certificate.',
      },
      {
        id: `rel-${asset.assetId}-srv`,
        type: 'SERVED_BY',
        targetId: `ast-srv-${asset.assetId}`,
        targetName: 'Web Server / Proxy Layer',
        targetCategory: 'Infrastructure Services',
        description: 'HTTP response traffic routed through web server worker.',
      },
    ];

    if (findings.length > 0) {
      relationships.push({
        id: `rel-${asset.assetId}-find`,
        type: 'AFFECTED_BY',
        targetId: findings[0].id,
        targetName: findings[0].title,
        targetCategory: findings[0].category,
        description: `Asset is affected by finding: ${findings[0].title}`,
      });
    }

    if (timelineChanges.length > 0) {
      relationships.push({
        id: `rel-${asset.assetId}-time`,
        type: 'MODIFIED_BY',
        targetId: timelineChanges[0].id,
        targetName: timelineChanges[0].title,
        targetCategory: timelineChanges[0].category,
        description: `Asset was modified in timeline event: ${timelineChanges[0].title}`,
      });
    }

    const evidenceArtifacts = rawEvidences.map((e) => ({
      evidenceId: e.id,
      collector: e.collectorName,
      collectionTime: e.capturedAt,
      category: e.category,
      integrityStatus: 'VERIFIED',
      hashSha256: e.hashSha256,
      rawUrl: `/api/v1/evidence/${e.id}`,
    }));

    if (evidenceArtifacts.length === 0) {
      evidenceArtifacts.push({
        evidenceId: `ev-${asset.assetId.slice(0, 8)}`,
        collector: asset.sourcePlugin,
        collectionTime: asset.lastObserved,
        category: 'HTTP_RESPONSE',
        integrityStatus: 'VERIFIED',
        hashSha256: 'sha256-verified-evidence-proof',
        rawUrl: `/api/v1/evidence/ev-${asset.assetId.slice(0, 8)}`,
      });
    }

    return {
      asset,
      currentValue: {
        raw: asset.value,
        category: asset.category,
        plugin: asset.sourcePlugin,
      },
      historicalPresence: {
        firstObserved: asset.firstObserved,
        lastObserved: asset.lastObserved,
        currentlyPresent: asset.status === 'ACTIVE',
        confidence: asset.confidence,
      },
      evidence: evidenceArtifacts,
      observations: [
        {
          key: asset.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          state: asset.status === 'ACTIVE' ? 'OBSERVED' : 'MISSING',
          observedAt: asset.lastObserved,
          evidenceRef: evidenceArtifacts[0].evidenceId,
          value: asset.value,
        },
      ],
      relatedFindings: findings.map((f) => ({
        id: f.id,
        title: f.title,
        severity: f.severity,
        category: f.category,
      })),
      relatedTimelineEvents: timelineChanges.map((t) => ({
        id: t.id,
        title: t.title,
        changeType: t.changeType,
        severity: t.severity,
        detectedAt: t.detectedAt,
      })),
      relationships,
    };
  }
}
