import { EvidenceFusionEngine } from './evidence-fusion.engine';
import {
  TechnologyCategory,
  TechnologyDetectionResult,
  BehavioralSignal,
} from '../contracts';

describe('EvidenceFusionEngine (T22-E — Evidence Fusion)', () => {
  let engine: EvidenceFusionEngine;

  beforeEach(() => {
    engine = new EvidenceFusionEngine();
  });

  it('fuses direct detection with behavioral signals into CORROBORATED posture with HIGH confidence', () => {
    const directResult: TechnologyDetectionResult = {
      id: 'tech-nginx',
      name: 'NGINX',
      category: TechnologyCategory.WEB_SERVER,
      status: 'DETECTED',
      confidence: 0.9,
      confidenceLevel: 'HIGH',
      whyDetected: 'Observed Server: nginx',
      role: 'Web Server / Reverse Proxy Gateway',
      infrastructureMeaning: 'NGINX serves as ingress gateway',
      evidence: [
        {
          sourceType: 'HTTP',
          source: 'Response Header: server',
          indicator: 'Server: nginx',
          confidence: 'HIGH',
        },
      ],
      signals: [
        {
          name: 'Server Header: NGINX',
          type: 'HEADER',
          indicator: 'Server: nginx',
          matched: true,
          weight: 10,
        },
      ],
      evidenceCount: 1,
    };

    const behavioralSignal: BehavioralSignal = {
      id: 'sig-http-nginx-ranges-test',
      category: 'HTTP',
      type: 'RANGE_HANDLING_FINGERPRINT',
      observationId: 'obs-nginx-ranges',
      strength: 0.85,
      confidence: 0.7,
      confidenceLevel: 'MEDIUM',
      description:
        'NGINX static byte-range delivery and HTTP/1.1 pipeline behavior',
      evidenceReferences: [
        'Response Header: accept-ranges (bytes)',
        'Response Header: etag ("64f1a2b3-1a2b")',
      ],
      targetTechnologyId: 'tech-nginx',
      targetTechnologyName: 'NGINX',
      targetCategory: TechnologyCategory.WEB_SERVER,
      targetLayer: 'GATEWAY',
      targetRole: 'Web Server / Reverse Proxy Gateway',
      observationState: 'OBSERVED',
      observedWireEvidence: 'Accept-Ranges: bytes, ETag: "64f1a2b3-1a2b"',
    };

    const { results, posturesByTechnology } = engine.fuse(
      [directResult],
      [behavioralSignal],
    );

    expect(results).toHaveLength(1);
    const fusedNginx = results[0];
    expect(posturesByTechnology['tech-nginx']).toBe('CORROBORATED');
    expect(fusedNginx.confidence).toBeGreaterThanOrEqual(0.95);
    expect(fusedNginx.confidenceLevel).toBe('HIGH');
    expect(fusedNginx.evidence.length).toBe(2);
    expect(
      fusedNginx.evidence.some((e) => e.sourceType === 'WIRE_BEHAVIOR'),
    ).toBe(true);
    expect(fusedNginx.signals.some((s) => s.type === 'WIRE_BEHAVIOR')).toBe(
      true,
    );
  });

  it('assigns DIRECT posture when direct detection exists without matching behavioral signals', () => {
    const directResult: TechnologyDetectionResult = {
      id: 'tech-stripe',
      name: 'Stripe',
      category: TechnologyCategory.PAYMENTS,
      status: 'DETECTED',
      confidence: 0.95,
      confidenceLevel: 'HIGH',
      whyDetected: 'Observed js.stripe.com script tag',
      role: 'Payment Processing Service',
      infrastructureMeaning: 'Stripe handles payment flows',
      evidence: [
        {
          sourceType: 'HTML',
          source: 'Script Tag',
          indicator: 'js.stripe.com/v3',
          confidence: 'HIGH',
        },
      ],
      signals: [],
      evidenceCount: 1,
    };

    const { results, posturesByTechnology } = engine.fuse([directResult], []);

    expect(results).toHaveLength(1);
    expect(posturesByTechnology['tech-stripe']).toBe('DIRECT');
    expect(results[0].confidence).toBe(0.95);
  });

  it('assigns CONSISTENT posture with MEDIUM confidence when multiple behavioral signals match a technology with stripped banners', () => {
    const signal1: BehavioralSignal = {
      id: 'sig-cookie-node',
      category: 'COOKIE',
      type: 'COOKIE_SEMANTIC_FINGERPRINT',
      observationId: 'obs-cookie-node',
      strength: 0.9,
      confidence: 0.7,
      confidenceLevel: 'MEDIUM',
      description:
        'Node.js Connect/Express session cookie identifier (connect.sid)',
      evidenceReferences: ['Response Header: Set-Cookie: connect.sid'],
      targetTechnologyId: 'tech-nodejs',
      targetTechnologyName: 'Node.js',
      targetCategory: TechnologyCategory.RUNTIME,
      targetLayer: 'RUNTIME',
      targetRole: 'Server-side JavaScript Runtime',
      observationState: 'OBSERVED',
      observedWireEvidence: 'Set-Cookie: connect.sid',
    };

    const signal2: BehavioralSignal = {
      id: 'sig-http-node',
      category: 'HTTP',
      type: 'CONNECTION_SEMANTICS_FINGERPRINT',
      observationId: 'obs-http-node',
      strength: 0.85,
      confidence: 0.7,
      confidenceLevel: 'MEDIUM',
      description: 'Keep-Alive: timeout=5 socket parameterization',
      evidenceReferences: ['Response Header: keep-alive (timeout=5)'],
      targetTechnologyId: 'tech-nodejs',
      targetTechnologyName: 'Node.js',
      targetCategory: TechnologyCategory.RUNTIME,
      targetLayer: 'RUNTIME',
      targetRole: 'Server-side JavaScript Runtime',
      observationState: 'OBSERVED',
      observedWireEvidence: 'Keep-Alive: timeout=5',
    };

    const { results, posturesByTechnology } = engine.fuse(
      [],
      [signal1, signal2],
    );

    expect(results).toHaveLength(1);
    const nodeResult = results[0];
    expect(posturesByTechnology['tech-nodejs']).toBe('CONSISTENT');
    expect(nodeResult.name).toBe('Node.js');
    expect(nodeResult.whyDetected).toContain('consistent with Node.js');
    expect(nodeResult.whatThisDoesNotProve).toContain(
      'absence of direct explicit banners prevents deterministic version',
    );
    expect(nodeResult.evidence.length).toBe(2);
  });

  it('assigns WEAK_SIGNAL posture with LOW confidence when only a single weak behavioral signal exists', () => {
    const weakSignal: BehavioralSignal = {
      id: 'sig-http-weak',
      category: 'HTTP',
      type: 'HEADER_ORDER_FINGERPRINT',
      observationId: 'obs-http-weak',
      strength: 0.5,
      confidence: 0.4,
      confidenceLevel: 'LOW',
      description: 'Vary header pattern',
      evidenceReferences: ['Response Header: vary (Cookie)'],
      targetTechnologyId: 'tech-django',
      targetTechnologyName: 'Django',
      targetCategory: TechnologyCategory.FRAMEWORK,
      targetLayer: 'APPLICATION',
      targetRole: 'Python Web Framework',
      observationState: 'OBSERVED',
      observedWireEvidence: 'Vary: Cookie',
    };

    const { results, posturesByTechnology } = engine.fuse([], [weakSignal]);

    expect(results).toHaveLength(1);
    expect(posturesByTechnology['tech-django']).toBe('WEAK_SIGNAL');
    expect(results[0].confidenceLevel).toBe('LOW');
    expect(results[0].whyDetected).toContain('Weak behavioral indicator');
  });
});
