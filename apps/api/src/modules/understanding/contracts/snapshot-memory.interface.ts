import {
  DetectedTechnology,
  InfrastructureTopology,
  InfrastructureArchitectureBrief,
} from '../../../infrastructure/discovery/technology/contracts';

export interface SnapshotFingerprints {
  readonly technologyFingerprint: string;
  readonly topologyFingerprint: string;
  readonly architectureFingerprint: string;
  readonly evidenceFingerprint: string;
  readonly overallFingerprint: string;
}

export interface InfrastructureSnapshotMemory {
  readonly snapshotId: string;
  readonly domainId: string;
  readonly domainName: string;
  readonly observedAt: string;
  readonly createdAt: string;
  readonly snapshotVersion: string;

  readonly technologies: DetectedTechnology[];
  readonly topology: InfrastructureTopology;
  readonly architectureBrief: InfrastructureArchitectureBrief;

  readonly fingerprints: SnapshotFingerprints;
}

export interface TemporalBaselineComparison {
  readonly currentSnapshotId: string;
  readonly baselineSnapshotId: string | null;
  readonly isIdentical: boolean;
  readonly hasTechnologyChanges: boolean;
  readonly hasTopologyChanges: boolean;
  readonly hasArchitectureChanges: boolean;
  readonly hasEvidenceChanges: boolean;
}
