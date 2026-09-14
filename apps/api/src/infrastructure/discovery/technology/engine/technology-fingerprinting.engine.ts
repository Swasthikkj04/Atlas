import { Injectable, Logger } from '@nestjs/common';
import { TechnologyDetectorRegistryService } from '../registry/technology-detector-registry.service';
import { TechnologyMeaningEngine } from './technology-meaning.engine';
import { DeepBehavioralFingerprintingEngine } from './deep-behavioral-fingerprinting.engine';
import { InfrastructureRelationshipEngine } from './infrastructure-relationship.engine';
import { InfrastructureArchitectureSynthesisEngine } from './infrastructure-architecture-synthesis.engine';
import {
  TechnologyDetectionContext,
  TechnologyDetectionResult,
  TechnologyDiscoveryResult,
} from '../contracts';

@Injectable()
export class TechnologyFingerprintingEngine {
  private readonly logger = new Logger(TechnologyFingerprintingEngine.name);

  constructor(
    private readonly registry: TechnologyDetectorRegistryService,
    private readonly behavioralEngine: DeepBehavioralFingerprintingEngine,
    private readonly meaningEngine: TechnologyMeaningEngine,
    private readonly relationshipEngine: InfrastructureRelationshipEngine,
    private readonly synthesisEngine: InfrastructureArchitectureSynthesisEngine,
  ) {}

  async fingerprint(
    context: TechnologyDetectionContext,
  ): Promise<TechnologyDiscoveryResult> {
    const rawResults = await this.registry.execute(context);

    // 1. Evaluate deep wire & behavioral signatures (Move 2) even when banners are stripped
    const { results: behavioralEnrichedResults, behavioralResult } =
      this.behavioralEngine.analyze(context, rawResults);

    // 2. Interpret and enrich all detections with authoritative meaning, role, and claim boundaries (TECH-002)
    const interpretedResults = await this.meaningEngine.interpretAll(
      behavioralEnrichedResults,
      context,
    );

    // 2. Deduplicate by technology name, keeping highest confidence detection if duplicate exists
    const uniqueMap = new Map<string, TechnologyDetectionResult>();
    for (const result of interpretedResults) {
      const existing = uniqueMap.get(result.name);
      if (!existing || result.confidence > existing.confidence) {
        uniqueMap.set(result.name, result);
      }
    }

    // 3. Sort deterministically: highest confidence first, then alphabetical by name
    const technologies = Array.from(uniqueMap.values()).sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return a.name.localeCompare(b.name);
    });

    // 4. Map relationships and construct evidence-backed infrastructure topology graph (TECH-003)
    const topology = await this.relationshipEngine.buildTopology(
      technologies,
      context,
    );

    // 5. Synthesize complete, evidence-grounded Infrastructure Architecture Brief (TECH-004)
    const architectureBrief = await this.synthesisEngine.synthesize(
      topology,
      context,
    );

    const evaluatedDetectorsCount = this.registry.list().length;

    this.logger.debug(
      `Fingerprinted ${context.domainName}: detected ${technologies.length} / ${evaluatedDetectorsCount} technologies, mapped ${topology.totalRelationships} topology relationships, synthesized architecture brief (confidence=${architectureBrief.confidence.overallLevel})`,
    );

    return {
      technologies,
      topology,
      architectureBrief,
      behavioralFingerprint: behavioralResult,
      totalDetected: technologies.length,
      evaluatedDetectorsCount,
      evaluatedAt: new Date().toISOString(),
    };
  }
}
