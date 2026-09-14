import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto } from '../../types/api/overview.dto';

describe('T8: Next.js Workspace Vertical Experience Invariants', () => {
  it('verifies Next.js architecture payload contains authoritative role, meaning, and anti-overreach claim boundaries', () => {
    const nextArchitecture: TechnologyArchitectureOverviewDto = {
      architectureSummary:
        'The public endpoint appears to be served through an NGINX reverse proxy gateway delivering a Next.js hybrid web application.',
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
          technologyId: 'tech-nextjs',
          technologyName: 'Next.js',
          role: 'Application Framework',
        },
      ],
      layers: [
        {
          layer: 'APPLICATION',
          state: 'OBSERVED',
          confidenceLevel: 'HIGH',
          technologies: [
            {
              technologyId: 'tech-nextjs',
              name: 'Next.js',
              category: 'Frameworks',
              layer: 'APPLICATION',
              role: 'Application Framework',
              infrastructureMeaning:
                'The public endpoint appears to use Next.js for hybrid client/server-side application delivery and routing.',
              whyDetected: 'Observed X-Powered-By: Next.js response header and __NEXT_DATA__ script tag',
              whatThisDoesNotProve:
                'Next.js presence confirms application framework, but does not prove Vercel hosting, AWS origin, Node.js backend execution, SSR/SSG execution mode, or database backend.',
              confidence: 0.98,
              confidenceLevel: 'HIGH',
              evidence: [],
            },
          ],
        },
      ],
      keyTechnologies: [
        {
          technologyId: 'tech-nextjs',
          name: 'Next.js',
          category: 'Frameworks',
          layer: 'APPLICATION',
          role: 'Application Framework',
          infrastructureMeaning:
            'The public endpoint appears to use Next.js for hybrid client/server-side application delivery and routing.',
          whyDetected: 'Observed X-Powered-By: Next.js response header and __NEXT_DATA__ script tag',
          whatThisDoesNotProve:
            'Next.js presence confirms application framework, but does not prove Vercel hosting, AWS origin, Node.js backend execution, SSR/SSG execution mode, or database backend.',
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          evidence: [],
        },
      ],
      integrations: [],
      knownUnknowns: [
        {
          dimension: 'Server Hosting Provider',
          status: 'UNOBSERVED',
          explanation: 'Hosting infrastructure (Vercel, AWS, custom Node.js/Docker) is unobservable from public HTTP payload.',
          whyUnknown: 'Web gateway proxies requests without revealing backend cluster orchestration details.',
        },
      ],
      claimBoundaries: [
        {
          technologyId: 'tech-nextjs',
          technologyName: 'Next.js',
          boundary:
            'Next.js presence does not establish Vercel hosting, AWS origin, Node.js runtime, or private database.',
        },
      ],
      confidence: {
        overallLevel: 'HIGH',
        overallScore: 0.98,
        layerConfidence: { APPLICATION: 'HIGH' },
        rationale: 'Authoritative X-Powered-By header and __NEXT_DATA__ payload',
        confirmedRelationshipsCount: 2,
        supportedRelationshipsCount: 0,
        inferredRelationshipsCount: 0,
      },
    };

    // 1. Ingress Path Verification
    assert.equal(nextArchitecture.ingressPath.length, 3);
    assert.equal(nextArchitecture.ingressPath[2].technologyName, 'Next.js');
    assert.equal(nextArchitecture.ingressPath[2].layer, 'APPLICATION');

    // 2. Meaning & Anti-Overreach Verification
    const nextjs = nextArchitecture.keyTechnologies[0];
    assert.equal(nextjs.name, 'Next.js');
    assert.equal(nextjs.category, 'Frameworks');
    assert.ok(nextjs.infrastructureMeaning.includes('hybrid client/server-side application delivery'));
    assert.ok(nextjs.whatThisDoesNotProve?.includes('does not prove Vercel hosting'));

    // 3. Known Unknowns Verification
    assert.equal(nextArchitecture.knownUnknowns.length, 1);
    assert.equal(nextArchitecture.knownUnknowns[0].status, 'UNOBSERVED');
    assert.equal(nextArchitecture.knownUnknowns[0].dimension, 'Server Hosting Provider');
  });
});
