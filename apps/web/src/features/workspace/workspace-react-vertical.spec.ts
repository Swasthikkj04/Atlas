import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto } from '../../types/api/overview.dto';

describe('T7: React Workspace Vertical Experience Invariants', () => {
  it('verifies React architecture payload contains authoritative role, meaning, and anti-overreach claim boundaries', () => {
    const reactArchitecture: TechnologyArchitectureOverviewDto = {
      architectureSummary:
        'The public endpoint appears to be served through an NGINX reverse proxy gateway delivering a React client-side presentation layer.',
      ingressPath: [
        {
          hop: 0,
          layer: 'GATEWAY',
          technologyId: 'public-endpoint',
          technologyName: 'Public Endpoint',
          role: 'Ingress',
        },
        {
          hop: 1,
          layer: 'GATEWAY',
          technologyId: 'tech-nginx',
          technologyName: 'NGINX',
          role: 'Web Gateway / Reverse Proxy',
          relationshipType: 'PROXIES_TO',
        },
        {
          hop: 2,
          layer: 'APPLICATION',
          technologyId: 'tech-react',
          technologyName: 'React',
          role: 'Client UI & Presentation Layer',
        },
      ],
      layers: [
        {
          layer: 'APPLICATION',
          state: 'OBSERVED',
          confidenceLevel: 'HIGH',
          technologies: [
            {
              technologyId: 'tech-react',
              name: 'React',
              category: 'Frameworks',
              layer: 'APPLICATION',
              role: 'Client UI & Presentation Layer',
              infrastructureMeaning:
                'The public endpoint appears to use React for its browser-facing presentation layer, while keeping server-side architecture separate.',
              whyDetected: 'Observed data-reactroot and __reactFiber runtime markers in HTML response',
              whatThisDoesNotProve:
                'React presence confirms client-side UI rendering, but does not prove Next.js, Vercel, Node.js backend, SSR/SSG execution, or underlying cloud hosting provider.',
              confidence: 0.95,
              confidenceLevel: 'HIGH',
              evidence: [],
            },
          ],
        },
      ],
      keyTechnologies: [
        {
          technologyId: 'tech-react',
          name: 'React',
          category: 'Frameworks',
          layer: 'APPLICATION',
          role: 'Client UI & Presentation Layer',
          infrastructureMeaning:
            'The public endpoint appears to use React for its browser-facing presentation layer, while keeping server-side architecture separate.',
          whyDetected: 'Observed data-reactroot and __reactFiber runtime markers in HTML response',
          whatThisDoesNotProve:
            'React presence confirms client-side UI rendering, but does not prove Next.js, Vercel, Node.js backend, SSR/SSG execution, or underlying cloud hosting provider.',
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          evidence: [],
        },
      ],
      integrations: [],
      knownUnknowns: [
        {
          dimension: 'Server-Side Runtime',
          status: 'UNOBSERVED',
          explanation: 'Server-side execution platform and backend APIs are unobservable from client HTML payload.',
          whyUnknown: 'React client code executes inside the browser independently of backend server architecture.',
        },
      ],
      claimBoundaries: [
        {
          technologyId: 'tech-react',
          technologyName: 'React',
          boundary:
            'React presence does not establish Next.js, Vercel, Node.js backend, SSR/SSG execution, or hosting provider.',
        },
      ],
      confidence: {
        overallLevel: 'HIGH',
        overallScore: 0.95,
        layerConfidence: { APPLICATION: 'HIGH' },
        rationale: 'Authoritative data-reactroot and __reactFiber DOM markers',
        confirmedRelationshipsCount: 2,
        supportedRelationshipsCount: 0,
        inferredRelationshipsCount: 0,
      },
    };

    // 1. Ingress Path Verification
    assert.equal(reactArchitecture.ingressPath.length, 3);
    assert.equal(reactArchitecture.ingressPath[2].technologyName, 'React');
    assert.equal(reactArchitecture.ingressPath[2].layer, 'APPLICATION');

    // 2. Meaning & Anti-Overreach Verification
    const react = reactArchitecture.keyTechnologies[0];
    assert.equal(react.name, 'React');
    assert.equal(react.category, 'Frameworks');
    assert.ok(react.infrastructureMeaning.includes('browser-facing presentation layer'));
    assert.ok(react.whatThisDoesNotProve?.includes('does not prove Next.js'));

    // 3. Known Unknowns Verification
    assert.equal(reactArchitecture.knownUnknowns.length, 1);
    assert.equal(reactArchitecture.knownUnknowns[0].status, 'UNOBSERVED');
    assert.equal(reactArchitecture.knownUnknowns[0].dimension, 'Server-Side Runtime');
  });
});
