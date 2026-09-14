import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto } from '../../types/api/overview.dto';

describe('T5: NGINX Workspace Vertical Experience Invariants', () => {
  it('verifies NGINX architecture payload contains authoritative role, meaning, version, and anti-overreach claim boundaries', () => {
    const nginxArchitecture: TechnologyArchitectureOverviewDto = {
      architectureSummary:
        'The public endpoint appears to be routed through Cloudflare edge infrastructure before reaching an NGINX reverse proxy gateway and Next.js application.',
      ingressPath: [
        {
          hop: 0,
          layer: 'EDGE',
          technologyId: 'public-endpoint',
          technologyName: 'Public Endpoint',
          role: 'Ingress',
        },
        {
          hop: 1,
          layer: 'EDGE',
          technologyId: 'tech-cloudflare',
          technologyName: 'Cloudflare',
          role: 'Edge CDN',
          relationshipType: 'FORWARDS_TO',
        },
        {
          hop: 2,
          layer: 'GATEWAY',
          technologyId: 'tech-nginx',
          technologyName: 'NGINX',
          role: 'Web Gateway / Reverse Proxy',
          relationshipType: 'PROXIES_TO',
        },
        {
          hop: 3,
          layer: 'APPLICATION',
          technologyId: 'tech-nextjs',
          technologyName: 'Next.js',
          role: 'Application Framework',
        },
      ],
      layers: [
        {
          layer: 'GATEWAY',
          state: 'OBSERVED',
          confidenceLevel: 'HIGH',
          technologies: [
            {
              technologyId: 'tech-nginx',
              name: 'NGINX',
              version: '1.24.0',
              category: 'Web / Server',
              layer: 'GATEWAY',
              role: 'Web Gateway / Reverse Proxy',
              infrastructureMeaning:
                'NGINX appears to participate in handling or forwarding public HTTP traffic at the observed gateway/application boundary.',
              whyDetected: 'Observed Server: nginx/1.24.0 response header',
              whatThisDoesNotProve:
                'NGINX presence confirms web gateway software, but does not prove underlying Linux distribution, Docker, Kubernetes, AWS/cloud hosting, or downstream application framework.',
              confidence: 0.99,
              confidenceLevel: 'HIGH',
              evidence: [],
            },
          ],
        },
      ],
      keyTechnologies: [
        {
          technologyId: 'tech-nginx',
          name: 'NGINX',
          version: '1.24.0',
          category: 'Web / Server',
          layer: 'GATEWAY',
          role: 'Web Gateway / Reverse Proxy',
          infrastructureMeaning:
            'NGINX appears to participate in handling or forwarding public HTTP traffic at the observed gateway/application boundary.',
          whyDetected: 'Observed Server: nginx/1.24.0 response header',
          whatThisDoesNotProve:
            'NGINX presence confirms web gateway software, but does not prove underlying Linux distribution, Docker, Kubernetes, AWS/cloud hosting, or downstream application framework.',
          confidence: 0.99,
          confidenceLevel: 'HIGH',
          evidence: [],
        },
      ],
      integrations: [],
      knownUnknowns: [
        {
          dimension: 'Runtime Environment',
          status: 'UNOBSERVED',
          explanation: 'Underlying operating system and container runtime are unobservable from public HTTP headers.',
          whyUnknown: 'Web gateway terminates HTTP responses without leaking underlying kernel or container topology.',
        },
      ],
      claimBoundaries: [
        {
          technologyId: 'tech-nginx',
          technologyName: 'NGINX',
          boundary:
            'NGINX presence does not establish Linux, Docker, Kubernetes, AWS/GCP hosting, or private backend applications.',
        },
      ],
      confidence: {
        overallLevel: 'HIGH',
        overallScore: 0.99,
        layerConfidence: { GATEWAY: 'HIGH' },
        rationale: 'Authoritative Server: nginx/1.24.0 header signature',
        confirmedRelationshipsCount: 3,
        supportedRelationshipsCount: 0,
        inferredRelationshipsCount: 0,
      },
    };

    // 1. Ingress Path Verification
    assert.equal(nginxArchitecture.ingressPath.length, 4);
    assert.equal(nginxArchitecture.ingressPath[2].technologyName, 'NGINX');
    assert.equal(nginxArchitecture.ingressPath[2].layer, 'GATEWAY');

    // 2. Meaning, Version, & Anti-Overreach Verification
    const nginx = nginxArchitecture.keyTechnologies[0];
    assert.equal(nginx.name, 'NGINX');
    assert.equal(nginx.version, '1.24.0');
    assert.equal(nginx.category, 'Web / Server');
    assert.ok(nginx.infrastructureMeaning.includes('handling or forwarding public HTTP traffic'));
    assert.ok(nginx.whatThisDoesNotProve?.includes('does not prove underlying Linux distribution'));

    // 3. Known Unknowns Verification
    assert.equal(nginxArchitecture.knownUnknowns[0].status, 'UNOBSERVED');
    assert.equal(nginxArchitecture.knownUnknowns[0].dimension, 'Runtime Environment');
  });
});
