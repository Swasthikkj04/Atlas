import { TechnologyFingerprintingEngine } from './technology-fingerprinting.engine';
import { TechnologyMeaningEngine } from './technology-meaning.engine';
import { InfrastructureRelationshipEngine } from './infrastructure-relationship.engine';
import { TechnologyDetectorRegistryService } from '../registry/technology-detector-registry.service';
import { TechnologyRelationshipRegistryService } from '../registry/technology-relationship-registry.service';
import {
  TechnologyDetector,
  TechnologyCategory,
  TechnologyDetectionContext,
  TechnologyDetectionResult,
} from '../contracts';
import { createTechnologyDetectionContext } from '../context/technology-detection-context.impl';

import { DeepBehavioralFingerprintingEngine } from './deep-behavioral-fingerprinting.engine';
import { InfrastructureArchitectureSynthesisEngine } from './infrastructure-architecture-synthesis.engine';

describe('TechnologyFingerprintingEngine', () => {
  let registry: TechnologyDetectorRegistryService;
  let behavioralEngine: DeepBehavioralFingerprintingEngine;
  let meaningEngine: TechnologyMeaningEngine;
  let relRegistry: TechnologyRelationshipRegistryService;
  let relEngine: InfrastructureRelationshipEngine;
  let synthesisEngine: InfrastructureArchitectureSynthesisEngine;
  let engine: TechnologyFingerprintingEngine;

  const createDetector = (
    id: string,
    name: string,
    confidence: number,
    category = TechnologyCategory.WEB_SERVER,
  ): TechnologyDetector => ({
    id,
    name,
    category,
    description: `${name} detector`,
    role: `${name} Role`,
    infrastructureMeaning: `${name} infrastructure meaning`,
    detectionSignals: ['signal'],
    confidenceRules: 'rules',
    detect: (
      context: TechnologyDetectionContext,
    ): TechnologyDetectionResult => ({
      id,
      name,
      category,
      status: 'DETECTED',
      confidence,
      confidenceLevel: confidence >= 0.9 ? 'HIGH' : 'MEDIUM',
      whyDetected: `Observed ${name} signals`,
      role: `${name} Role`,
      infrastructureMeaning: `${name} infrastructure meaning`,
      evidence: [
        {
          sourceType: 'HTTP',
          source: 'Header',
          indicator: name,
          confidence: 'HIGH',
        },
      ],
      signals: [
        {
          name,
          type: 'HEADER',
          indicator: name,
          matched: true,
          weight: 10,
        },
      ],
      evidenceCount: 1,
    }),
  });

  beforeEach(() => {
    registry = new TechnologyDetectorRegistryService();
    behavioralEngine = new DeepBehavioralFingerprintingEngine();
    meaningEngine = new TechnologyMeaningEngine(registry);
    relRegistry = new TechnologyRelationshipRegistryService();
    relEngine = new InfrastructureRelationshipEngine(relRegistry);
    synthesisEngine = new InfrastructureArchitectureSynthesisEngine();
    engine = new TechnologyFingerprintingEngine(
      registry,
      behavioralEngine,
      meaningEngine,
      relEngine,
      synthesisEngine,
    );
  });

  it('runs fingerprinting and returns deterministically sorted technologies by confidence', async () => {
    registry.register(createDetector('tech-c', 'Tech C (Medium)', 0.75));
    registry.register(createDetector('tech-a', 'Tech A (High)', 0.99));
    registry.register(createDetector('tech-b', 'Tech B (High)', 0.95));

    const context = createTechnologyDetectionContext({
      domainName: 'test.com',
    });

    const result = await engine.fingerprint(context);

    expect(result.totalDetected).toBe(3);
    expect(result.evaluatedDetectorsCount).toBe(3);
    expect(result.technologies).toHaveLength(3);
    expect(result.topology).toBeDefined();

    // Verify confidence descending order
    expect(result.technologies[0].name).toBe('Tech A (High)');
    expect(result.technologies[0].confidence).toBe(0.99);
    expect(result.technologies[1].name).toBe('Tech B (High)');
    expect(result.technologies[1].confidence).toBe(0.95);
    expect(result.technologies[2].name).toBe('Tech C (Medium)');
    expect(result.technologies[2].confidence).toBe(0.75);
  });

  it('deduplicates technology detections by keeping the highest confidence result', async () => {
    registry.register(createDetector('detector-1', 'Shared Technology', 0.8));
    registry.register(createDetector('detector-2', 'Shared Technology', 0.95));

    const context = createTechnologyDetectionContext({
      domainName: 'test.com',
    });

    const result = await engine.fingerprint(context);

    expect(result.totalDetected).toBe(1);
    expect(result.technologies).toHaveLength(1);
    expect(result.technologies[0].confidence).toBe(0.95);
  });

  it('preserves rich evidence, signals, and topology in detection results', async () => {
    registry.register(createDetector('tech-evidence', 'Evidence Tech', 0.98));

    const context = createTechnologyDetectionContext({
      domainName: 'test.com',
    });

    const result = await engine.fingerprint(context);
    const tech = result.technologies[0];

    expect(tech.role).toBe('Evidence Tech Role');
    expect(tech.infrastructureMeaning).toBe(
      'Evidence Tech infrastructure meaning',
    );
    expect(tech.evidence).toHaveLength(1);
    expect(tech.evidence[0].sourceType).toBe('HTTP');
    expect(tech.signals).toHaveLength(1);
    expect(tech.signals[0].matched).toBe(true);

    expect(result.topology).toBeDefined();
    expect(result.topology?.nodes).toHaveLength(1);
  });
});
