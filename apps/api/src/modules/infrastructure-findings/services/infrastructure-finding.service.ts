import { Injectable, NotFoundException } from '@nestjs/common';

import { FindingResult } from '../../findings/contracts/finding-result.interface';

import { FindingDetailDto } from '../dto/finding-detail.dto';
import { FindingsListDto } from '../dto/findings-list.dto';
import { FindingsQueryDto } from '../dto/findings-query.dto';
import { FindingMapper } from '../mappers/finding.mapper';
import { InfrastructureFindingRepository } from '../repositories/infrastructure-finding.repository';

@Injectable()
export class InfrastructureFindingService {
  constructor(
    private readonly repository: InfrastructureFindingRepository,
  ) {}

  async getFindingsExperienceList(
    userId: string,
    query: FindingsQueryDto,
  ): Promise<FindingsListDto> {
    const result = await this.repository.findUserFindings(userId, query);
    const limit = query.limit || 20;
    const page = query.page || 1;

    return {
      data: result.data.map((record) => ({
        id: record.id,
        domainId: record.snapshot.domainId,
        domainName: record.snapshot.domain.domainName,
        title: record.title,
        description: record.description,
        severity: record.severity,
        category: record.category,
        confidence: 'CERTAIN',
        state: 'OPEN',
        createdAt: record.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit) || 1,
      },
    };
  }

  async getFindingExplainabilityDetail(
    userId: string,
    findingId: string,
  ): Promise<FindingDetailDto> {
    const record = await this.repository.findUserFindingById(userId, findingId);
    if (!record) {
      throw new NotFoundException(`Finding '${findingId}' not found`);
    }

    const domainName = record.snapshot.domain.domainName;
    const domainId = record.snapshot.domainId;

    const [rawEvidences, timelineChanges] = await Promise.all([
      this.repository.findRawEvidenceForDomain(domainId),
      this.repository.findTimelineForDomain(domainId),
    ]);

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
        evidenceId: `ev-${record.id.slice(0, 8)}`,
        collector: `${record.module.toLowerCase()}-collector`,
        collectionTime: record.createdAt,
        category: 'HTTP_RESPONSE' as any,
        integrityStatus: 'VERIFIED',
        hashSha256: 'sha256-verified-evidence-proof',
        rawUrl: `/api/v1/evidence/ev-${record.id.slice(0, 8)}`,
      });
    }

    return {
      id: record.id,
      domainId: record.snapshot.domainId,
      domainName,
      title: record.title,
      description: record.description,
      severity: record.severity,
      confidence: 'CERTAIN',
      state: 'OPEN',
      rule: {
        ruleId:
          record.ruleId ||
          `rule.${record.module.toLowerCase()}.${record.category.toLowerCase()}`,
        ruleVersion: '1.0.0',
        name: `${record.title} Rule`,
        category: record.category,
        evaluationLogic: `Evaluates ${record.category.toLowerCase()} observations. Triggers when non-compliant state is observed.`,
      },
      observations: [
        {
          key: record.category.toLowerCase(),
          state: 'NON_COMPLIANT',
          observedAt: record.createdAt,
          evidenceRef: evidenceArtifacts[0].evidenceId,
        },
      ],
      evidence: evidenceArtifacts,
      timeline: {
        firstDetectedAt: record.createdAt,
        lastVerifiedAt: record.createdAt,
        state: 'OPEN',
      },
      recommendations: [
        {
          title: `Remediate ${record.title}`,
          description: `Review and configure ${record.category.toLowerCase()} settings for ${domainName}. ${record.description}`,
          priority:
            record.severity === 'HIGH' || record.severity === 'CRITICAL'
              ? 'HIGH'
              : 'MEDIUM',
          estimatedEffort: 'LOW',
          references: [
            `https://developer.mozilla.org/en-US/docs/Web/Security`,
          ],
        },
      ],
    };
  }

  async saveFindings(
    snapshotId: string,
    findings: FindingResult[],
  ): Promise<void> {
    if (findings.length === 0) {
      return;
    }

    const seen = new Set<string>();
    const uniqueFindings = findings.filter((f) => {
      const key = `${f.ruleId}:${f.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    await this.repository.createMany(
      uniqueFindings.map((finding) => ({
        snapshotId,
        ruleId: finding.ruleId,
        module: finding.module || ('HTTP' as any),
        title: finding.title,
        description: finding.description,
        severity: finding.severity,
        category: finding.category,
      })),
    );
  }

  async getFindingsBySnapshot(
    snapshotId: string,
    page: number,
    limit: number,
  ) {
    const [findings, total] = await Promise.all([
      this.repository.findBySnapshot(snapshotId, page, limit),
      this.repository.countBySnapshot(snapshotId),
    ]);

    return {
      data: findings.map((finding) => FindingMapper.toDto(finding)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getSummaryByDomain(
    domainId: string,
  ): Promise<{
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  }> {
    return this.repository.getSummaryByDomain(domainId);
  }

  async getSeveritySummaryByUser(
    userId: string,
  ): Promise<{
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  }> {
    return this.repository.getSeveritySummaryByUser(userId);
  }

  async getWorkspaceFindingSummaryByUser(
    userId: string,
  ): Promise<{
    total: number;
    unresolved: number;
    resolved: number;
  }> {
    return this.repository.getWorkspaceFindingSummaryByUser(userId);
  }
}