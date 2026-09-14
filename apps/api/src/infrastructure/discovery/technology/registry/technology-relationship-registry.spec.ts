import { TechnologyRelationshipRegistryService } from './technology-relationship-registry.service';
import {
  TechnologyRelationshipRule,
  TopologyNode,
  TechnologyRelationship,
  TechnologyRelationshipType,
  TopologyLayer,
} from '../contracts';
import { createTechnologyDetectionContext } from '../context/technology-detection-context.impl';

describe('TechnologyRelationshipRegistryService (TECH-003)', () => {
  let registry: TechnologyRelationshipRegistryService;

  const createMockRule = (
    id: string,
    name = 'Mock Relationship Rule',
  ): TechnologyRelationshipRule => ({
    id,
    name,
    description: 'Mock rule description',
    evaluate: (nodes: TopologyNode[]): TechnologyRelationship[] => {
      if (nodes.length < 2) return [];
      return [
        {
          id: `rel-${nodes[0].id}-${nodes[1].id}`,
          sourceTechnologyId: nodes[0].id,
          sourceTechnologyName: nodes[0].name,
          targetTechnologyId: nodes[1].id,
          targetTechnologyName: nodes[1].name,
          relationshipType: TechnologyRelationshipType.PROXIES_TO,
          evidenceState: 'SUPPORTED',
          confidence: 0.9,
          confidenceLevel: 'HIGH',
          explanation: 'Mock explanation',
          evidence: [],
        },
      ];
    },
  });

  beforeEach(() => {
    registry = new TechnologyRelationshipRegistryService();
  });

  describe('Registration & Lifecycle', () => {
    it('registers and retrieves a relationship rule', () => {
      const rule = createMockRule('rule-custom-1', 'Custom Rule 1');
      registry.register(rule);

      expect(registry.has('rule-custom-1')).toBe(true);
      expect(registry.get('rule-custom-1')).toBe(rule);
      expect(registry.list()).toHaveLength(1);
    });

    it('rejects duplicate rule IDs with a descriptive error', () => {
      const rule1 = createMockRule('rule-dup', 'Rule 1');
      const rule2 = createMockRule('rule-dup', 'Rule 2');

      registry.register(rule1);
      expect(() => registry.register(rule2)).toThrow(
        "Technology relationship rule with ID 'rule-dup' is already registered",
      );
    });

    it('validates rule properties upon registration', () => {
      expect(() => registry.register({} as any)).toThrow(
        'Technology relationship rule must have a valid non-empty id',
      );
      expect(() => registry.register({ id: 'bad', name: '' } as any)).toThrow(
        "Technology relationship rule 'bad' missing name",
      );
      expect(() =>
        registry.register({ id: 'bad', name: 'Name' } as any),
      ).toThrow("Technology relationship rule 'bad' missing evaluate method");
    });

    it('unregisters a rule successfully', () => {
      const rule = createMockRule('rule-removable', 'Removable Rule');
      registry.register(rule);

      expect(registry.unregister('rule-removable')).toBe(true);
      expect(registry.has('rule-removable')).toBe(false);
      expect(registry.unregister('non-existent')).toBe(false);
    });
  });

  describe('Evaluation & Error Isolation', () => {
    it('evaluates all rules across topology nodes', async () => {
      registry.register(createMockRule('rule-1'));

      const nodes: TopologyNode[] = [
        {
          id: 'tech-nginx',
          technologyId: 'tech-nginx',
          name: 'NGINX',
          category: 'Web Server',
          layer: TopologyLayer.GATEWAY,
          role: 'Web Gateway',
          infrastructureMeaning: 'NGINX reverse proxy',
          whyDetected: 'Server: nginx',
          confidence: 0.99,
          confidenceLevel: 'HIGH',
          evidenceCount: 1,
        },
        {
          id: 'tech-nextjs',
          technologyId: 'tech-nextjs',
          name: 'Next.js',
          category: 'Framework',
          layer: TopologyLayer.APPLICATION,
          role: 'Application Framework',
          infrastructureMeaning: 'Next.js rendering',
          whyDetected: 'X-Powered-By: Next.js',
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          evidenceCount: 1,
        },
      ];

      const context = createTechnologyDetectionContext({
        domainName: 'test.com',
      });

      const rels = await registry.evaluateAll(nodes, context);
      expect(rels).toHaveLength(1);
      expect(rels[0].sourceTechnologyId).toBe('tech-nginx');
      expect(rels[0].targetTechnologyId).toBe('tech-nextjs');
    });

    it('isolates exceptions thrown inside faulty rules without failing other rules', async () => {
      const buggyRule: TechnologyRelationshipRule = {
        id: 'rule-buggy',
        name: 'Buggy Rule',
        description: 'Throws',
        evaluate: () => {
          throw new Error('Unexpected rule explosion');
        },
      };

      const healthyRule = createMockRule('rule-healthy', 'Healthy Rule');

      registry.register(buggyRule);
      registry.register(healthyRule);

      const nodes: TopologyNode[] = [
        {
          id: 'node-1',
          technologyId: 'node-1',
          name: 'Node 1',
          category: 'Web Server',
          layer: TopologyLayer.GATEWAY,
          role: 'Gateway',
          infrastructureMeaning: 'Meaning',
          whyDetected: 'Detected',
          confidence: 0.9,
          confidenceLevel: 'HIGH',
          evidenceCount: 1,
        },
        {
          id: 'node-2',
          technologyId: 'node-2',
          name: 'Node 2',
          category: 'Framework',
          layer: TopologyLayer.APPLICATION,
          role: 'App',
          infrastructureMeaning: 'Meaning',
          whyDetected: 'Detected',
          confidence: 0.9,
          confidenceLevel: 'HIGH',
          evidenceCount: 1,
        },
      ];

      const context = createTechnologyDetectionContext({
        domainName: 'test.com',
      });

      const rels = await registry.evaluateAll(nodes, context);
      expect(rels).toHaveLength(1);
      expect(rels[0].sourceTechnologyId).toBe('node-1');
    });
  });
});
