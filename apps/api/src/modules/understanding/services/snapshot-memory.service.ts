import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  InfrastructureSnapshotMemory,
  SnapshotFingerprints,
  TemporalBaselineComparison,
} from '../contracts/snapshot-memory.interface';
import { SnapshotFingerprintService } from './snapshot-fingerprint.service';
import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { InfrastructureSnapshotRepository } from '../../infrastructure-snapshots/repositories/infrastructure-snapshot.repository';

@Injectable()
export class SnapshotMemoryService {
  private readonly logger = new Logger(SnapshotMemoryService.name);
  public static readonly SNAPSHOT_VERSION = '2.0.0';

  constructor(
    private readonly fingerprintService: SnapshotFingerprintService,
    private readonly snapshotRepository: InfrastructureSnapshotRepository,
  ) {}

  /**
   * Synthesizes and captures full immutable snapshot memory for an understanding run.
   */
  createSnapshotMemory(
    snapshotId: string,
    domainId: string,
    domainName: string,
    discoverySnapshot: DiscoverySnapshot,
    observedAt: Date = new Date(),
  ): InfrastructureSnapshotMemory {
    const fingerprints =
      this.fingerprintService.computeFingerprints(discoverySnapshot);

    const techResult = discoverySnapshot.technology;
    const technologies = techResult?.technologies || [];
    const topology = techResult?.topology || {
      nodes: [],
      relationships: [],
      layers: {} as any,
      summary: '',
      totalNodes: 0,
      totalRelationships: 0,
      confirmedRelationshipsCount: 0,
      supportedRelationshipsCount: 0,
      inferredRelationshipsCount: 0,
      generatedAt: new Date().toISOString(),
    };
    const architectureBrief = techResult?.architectureBrief || {
      summary: '',
      architecturePath: [],
      layers: [],
      keyTechnologies: [],
      integrations: [],
      evidence: [],
      confidence: {
        overallLevel: 'INCONCLUSIVE',
        overallScore: 0,
        layerConfidence: {} as any,
        rationale: '',
        confirmedRelationshipsCount: 0,
        supportedRelationshipsCount: 0,
        inferredRelationshipsCount: 0,
      },
      knownUnknowns: [],
      claimBoundaries: [],
      generatedAt: new Date().toISOString(),
    };

    return {
      snapshotId,
      domainId,
      domainName,
      observedAt: observedAt.toISOString(),
      createdAt: new Date().toISOString(),
      snapshotVersion: SnapshotMemoryService.SNAPSHOT_VERSION,
      technologies,
      topology,
      architectureBrief,
      fingerprints,
    };
  }

  /**
   * Deterministically compares current snapshot memory against a baseline using canonical fingerprints.
   */
  compareBaselines(
    current: InfrastructureSnapshotMemory,
    baseline: InfrastructureSnapshotMemory | null,
  ): TemporalBaselineComparison {
    if (!baseline) {
      return {
        currentSnapshotId: current.snapshotId,
        baselineSnapshotId: null,
        isIdentical: false,
        hasTechnologyChanges: true,
        hasTopologyChanges: true,
        hasArchitectureChanges: true,
        hasEvidenceChanges: true,
      };
    }

    const isIdentical =
      current.fingerprints.overallFingerprint ===
      baseline.fingerprints.overallFingerprint;

    const hasTechnologyChanges =
      current.fingerprints.technologyFingerprint !==
      baseline.fingerprints.technologyFingerprint;

    const hasTopologyChanges =
      current.fingerprints.topologyFingerprint !==
      baseline.fingerprints.topologyFingerprint;

    const hasArchitectureChanges =
      current.fingerprints.architectureFingerprint !==
      baseline.fingerprints.architectureFingerprint;

    const hasEvidenceChanges =
      current.fingerprints.evidenceFingerprint !==
      baseline.fingerprints.evidenceFingerprint;

    return {
      currentSnapshotId: current.snapshotId,
      baselineSnapshotId: baseline.snapshotId,
      isIdentical,
      hasTechnologyChanges,
      hasTopologyChanges,
      hasArchitectureChanges,
      hasEvidenceChanges,
    };
  }

  /**
   * Extracts structured snapshot memory from a persisted database snapshot entity.
   */
  extractMemoryFromPayload(
    snapshotEntity: any,
  ): InfrastructureSnapshotMemory | null {
    if (!snapshotEntity || !snapshotEntity.payload) {
      return null;
    }

    const payload = snapshotEntity.payload;
    if (payload.memory) {
      return payload.memory as InfrastructureSnapshotMemory;
    }

    // Reconstruct memory dynamically if legacy snapshot
    const domainName =
      snapshotEntity.domain?.domainName ||
      payload.domainName ||
      payload.domain ||
      'unknown-domain';

    const discoverySnapshot: DiscoverySnapshot = payload;
    return this.createSnapshotMemory(
      snapshotEntity.id,
      snapshotEntity.domainId,
      domainName,
      discoverySnapshot,
      snapshotEntity.createdAt || new Date(),
    );
  }

  /**
   * Retrieves the latest baseline snapshot memory for a domain.
   */
  async getLatestBaseline(
    domainId: string,
  ): Promise<InfrastructureSnapshotMemory | null> {
    const entity = await this.snapshotRepository.findLatestByDomain(domainId);
    return this.extractMemoryFromPayload(entity);
  }

  /**
   * Retrieves the immediate preceding baseline snapshot memory before a target snapshot.
   */
  async getPrecedingBaseline(
    domainId: string,
    currentSnapshotId: string,
  ): Promise<InfrastructureSnapshotMemory | null> {
    const currentEntity =
      await this.snapshotRepository.findById(currentSnapshotId);
    if (!currentEntity) return null;

    const precedingSnapshots = await this.snapshotRepository.findByDomain(
      domainId,
      1,
      10,
    );

    const precedingEntity = precedingSnapshots.find(
      (s) =>
        s.id !== currentSnapshotId &&
        new Date(s.createdAt).getTime() <=
          new Date(currentEntity.createdAt).getTime(),
    );

    return this.extractMemoryFromPayload(precedingEntity);
  }

  /**
   * Retrieves point-in-time snapshot memory by snapshot ID with domain ownership verification.
   */
  async getBaselineById(
    snapshotId: string,
    userId?: string,
  ): Promise<InfrastructureSnapshotMemory> {
    const entity = userId
      ? await this.snapshotRepository.findByIdForUser(snapshotId, userId)
      : await this.snapshotRepository.findById(snapshotId);

    if (!entity) {
      throw new NotFoundException(
        `Snapshot memory with ID '${snapshotId}' not found.`,
      );
    }

    const memory = this.extractMemoryFromPayload(entity);
    if (!memory) {
      throw new NotFoundException(
        `Payload for snapshot '${snapshotId}' is corrupt or unreadable.`,
      );
    }

    return memory;
  }
}
