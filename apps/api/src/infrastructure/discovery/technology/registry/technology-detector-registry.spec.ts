import { TechnologyDetectorRegistryService } from './technology-detector-registry.service';
import {
  TechnologyDetector,
  TechnologyCategory,
  TechnologyDetectionContext,
  TechnologyDetectionResult,
} from '../contracts';
import { createTechnologyDetectionContext } from '../context/technology-detection-context.impl';

describe('TechnologyDetectorRegistryService', () => {
  let registry: TechnologyDetectorRegistryService;

  const createMockDetector = (
    id: string,
    name = 'Mock Tech',
    category = TechnologyCategory.WEB_SERVER,
    shouldMatch = false,
  ): TechnologyDetector => ({
    id,
    name,
    category,
    description: 'Mock technology detector description',
    role: 'Mock Role',
    infrastructureMeaning: 'Mock Meaning',
    detectionSignals: ['mock-signal'],
    confidenceRules: 'mock confidence rules',
    detect: (
      context: TechnologyDetectionContext,
    ): TechnologyDetectionResult | null => {
      if (!shouldMatch) return null;
      return {
        id,
        name,
        category,
        status: 'DETECTED',
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        role: 'Mock Role',
        infrastructureMeaning: 'Mock Meaning',
        evidence: [
          {
            sourceType: 'HTTP',
            source: 'Mock Source',
            indicator: 'mock-indicator',
            confidence: 'HIGH',
          },
        ],
        signals: [
          {
            name: 'Mock Signal',
            type: 'HEADER',
            indicator: 'mock',
            matched: true,
            weight: 10,
          },
        ],
        evidenceCount: 1,
      };
    },
  });

  beforeEach(() => {
    registry = new TechnologyDetectorRegistryService();
  });

  describe('Registration & Retrieval', () => {
    it('registers and retrieves a detector successfully', () => {
      const detector = createMockDetector('tech-custom-1', 'Custom 1');
      registry.register(detector);

      expect(registry.has('tech-custom-1')).toBe(true);
      expect(registry.get('tech-custom-1')).toBe(detector);
      expect(registry.list()).toContain(detector);
      expect(registry.getDetectors()).toHaveLength(1);
    });

    it('rejects duplicate detector IDs with a descriptive error', () => {
      const detector1 = createMockDetector('tech-dup', 'Detector 1');
      const detector2 = createMockDetector('tech-dup', 'Detector 2');

      registry.register(detector1);
      expect(() => registry.register(detector2)).toThrow(
        "Technology detector with ID 'tech-dup' is already registered",
      );
    });

    it('rejects detectors missing required fields', () => {
      expect(() => registry.register({} as any)).toThrow(
        'Technology detector must have a valid non-empty id',
      );

      expect(() => registry.register({ id: 'bad-1', name: '' } as any)).toThrow(
        "Technology detector 'bad-1' missing name",
      );

      expect(() =>
        registry.register({ id: 'bad-2', name: 'Bad 2' } as any),
      ).toThrow("Technology detector 'bad-2' missing category");

      expect(() =>
        registry.register({
          id: 'bad-3',
          name: 'Bad 3',
          category: TechnologyCategory.WEB_SERVER,
        } as any),
      ).toThrow("Technology detector 'bad-3' missing detect method");
    });

    it('unregisters a detector and handles unknown detectors', () => {
      const detector = createMockDetector('tech-removable', 'Removable');
      registry.register(detector);

      expect(registry.unregister('tech-removable')).toBe(true);
      expect(registry.has('tech-removable')).toBe(false);
      expect(registry.get('tech-removable')).toBeUndefined();
      expect(registry.unregister('non-existent')).toBe(false);
    });

    it('clears all registered detectors', () => {
      registry.register(createMockDetector('tech-1'));
      registry.register(createMockDetector('tech-2'));
      expect(registry.list()).toHaveLength(2);

      registry.clear();
      expect(registry.list()).toHaveLength(0);
    });
  });

  describe('Execution & Fault Tolerance', () => {
    it('executes detectors and collects matching results', async () => {
      const matchingDetector = createMockDetector(
        'tech-match',
        'Matched Tech',
        TechnologyCategory.FRAMEWORK,
        true,
      );
      const nonMatchingDetector = createMockDetector(
        'tech-no-match',
        'Ignored Tech',
        TechnologyCategory.FRAMEWORK,
        false,
      );

      registry.register(matchingDetector);
      registry.register(nonMatchingDetector);

      const context = createTechnologyDetectionContext({
        domainName: 'example.com',
      });

      const results = await registry.execute(context);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('tech-match');
      expect(results[0].name).toBe('Matched Tech');
      expect(results[0].status).toBe('DETECTED');
    });

    it('gracefully isolates detector exceptions without crashing execution of remaining detectors', async () => {
      const buggyDetector: TechnologyDetector = {
        id: 'tech-buggy',
        name: 'Buggy Tech',
        category: TechnologyCategory.WEB_SERVER,
        description: 'Throws error',
        role: 'Buggy',
        infrastructureMeaning: 'Buggy',
        detectionSignals: [],
        confidenceRules: 'None',
        detect: () => {
          throw new Error('Unexpected crash inside detector');
        },
      };

      const healthyDetector = createMockDetector(
        'tech-healthy',
        'Healthy Tech',
        TechnologyCategory.CLOUD_INFRASTRUCTURE,
        true,
      );

      registry.register(buggyDetector);
      registry.register(healthyDetector);

      const context = createTechnologyDetectionContext({
        domainName: 'example.com',
      });

      const results = await registry.execute(context);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('tech-healthy');
    });
  });
});
