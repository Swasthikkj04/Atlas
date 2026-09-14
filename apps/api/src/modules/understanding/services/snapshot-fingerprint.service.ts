import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { SnapshotCanonicalizerService } from './snapshot-canonicalizer.service';
import { SnapshotFingerprints } from '../contracts/snapshot-memory.interface';
import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  DetectedTechnology,
  InfrastructureTopology,
  InfrastructureArchitectureBrief,
} from '../../../infrastructure/discovery/technology/contracts';

@Injectable()
export class SnapshotFingerprintService {
  constructor(private readonly canonicalizer: SnapshotCanonicalizerService) {}

  computeTechnologyFingerprint(technologies?: DetectedTechnology[]): string {
    const canonical = this.canonicalizer.canonicalizeTechnologies(technologies);
    return this.hashString(canonical);
  }

  computeTopologyFingerprint(topology?: InfrastructureTopology): string {
    const canonical = this.canonicalizer.canonicalizeTopology(topology);
    return this.hashString(canonical);
  }

  computeArchitectureFingerprint(
    brief?: InfrastructureArchitectureBrief,
  ): string {
    const canonical = this.canonicalizer.canonicalizeArchitecture(brief);
    return this.hashString(canonical);
  }

  computeEvidenceFingerprint(snapshot?: DiscoverySnapshot): string {
    const canonical = this.canonicalizer.canonicalizeEvidence(snapshot);
    return this.hashString(canonical);
  }

  computeFingerprints(snapshot: DiscoverySnapshot): SnapshotFingerprints {
    const techResult = snapshot.technology;

    const technologyFingerprint = this.computeTechnologyFingerprint(
      techResult?.technologies,
    );
    const topologyFingerprint = this.computeTopologyFingerprint(
      techResult?.topology,
    );
    const architectureFingerprint = this.computeArchitectureFingerprint(
      techResult?.architectureBrief,
    );
    const evidenceFingerprint = this.computeEvidenceFingerprint(snapshot);

    const compositePayload = `${technologyFingerprint}:${topologyFingerprint}:${architectureFingerprint}:${evidenceFingerprint}`;
    const overallFingerprint = this.hashString(compositePayload);

    return {
      technologyFingerprint,
      topologyFingerprint,
      architectureFingerprint,
      evidenceFingerprint,
      overallFingerprint,
    };
  }

  private hashString(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }
}
