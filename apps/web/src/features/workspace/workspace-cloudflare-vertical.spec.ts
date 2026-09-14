import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto } from '../../types/api/overview.dto';

describe('T1: Cloudflare Workspace Vertical Experience Invariants', () => {
  it('verifies Cloudflare architecture payload contains authoritative role, meaning, and claim boundaries', () => {
    const cloudflareArchitecture: TechnologyArchitectureOverviewDto = {
      architectureSummary:
        'The public endpoint appears to be delivered through Cloudflare edge infrastructure before requests reach the application.',
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
          role: 'Edge / CDN / WAF',
          relationshipType: 'FORWARDS_TO',
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
          layer: 'EDGE',
          state: 'OBSERVED',
          confidenceLevel: 'HIGH',
          technologies: [
            {
              technologyId: 'tech-cloudflare',
              name: 'Cloudflare',
              category: 'CDN / Edge',
              layer: 'EDGE',
              role: 'Global edge network and DDoS protection',
              infrastructureMeaning:
                'The public endpoint appears to be fronted by Cloudflare edge and security infrastructure.',
              whyDetected: 'Observed cf-ray and server: cloudflare response headers',
              whatThisDoesNotProve:
                'Presence of Cloudflare edge proxy does not identify or prove the underlying origin server hosting provider.',
              confidence: 0.99,
              confidenceLevel: 'HIGH',
              evidence: [],
            },
          ],
        },
      ],
      keyTechnologies: [
        {
          technologyId: 'tech-cloudflare',
          name: 'Cloudflare',
          category: 'CDN / Edge',
          layer: 'EDGE',
          role: 'Global edge network and DDoS protection',
          infrastructureMeaning:
            'The public endpoint appears to be fronted by Cloudflare edge and security infrastructure.',
          whyDetected: 'Observed cf-ray and server: cloudflare response headers',
          whatThisDoesNotProve:
            'Presence of Cloudflare edge proxy does not identify or prove the underlying origin server hosting provider.',
          confidence: 0.99,
          confidenceLevel: 'HIGH',
          evidence: [],
        },
      ],
      integrations: [],
      knownUnknowns: [
        {
          dimension: 'Origin Cloud Provider',
          status: 'MASKED',
          explanation: 'Origin infrastructure is masked behind Cloudflare Anycast proxies.',
          whyUnknown: 'Anycast proxies terminate client TCP connections before origin.',
        },
      ],
      claimBoundaries: [
        {
          technologyId: 'tech-cloudflare',
          technologyName: 'Cloudflare',
          boundary: 'Cloudflare presence does not establish origin hosting provider.',
        },
      ],
      confidence: {
        overallLevel: 'HIGH',
        overallScore: 0.99,
        layerConfidence: { EDGE: 'HIGH' },
        rationale: 'Authoritative HTTP headers and DNS NS records',
        confirmedRelationshipsCount: 2,
        supportedRelationshipsCount: 0,
        inferredRelationshipsCount: 0,
      },
    };

    // 1. Ingress Path Verification
    assert.equal(cloudflareArchitecture.ingressPath.length, 3);
    assert.equal(cloudflareArchitecture.ingressPath[1].technologyName, 'Cloudflare');
    assert.equal(cloudflareArchitecture.ingressPath[1].layer, 'EDGE');

    // 2. Meaning & Anti-Overreach Verification
    const cf = cloudflareArchitecture.keyTechnologies[0];
    assert.equal(cf.name, 'Cloudflare');
    assert.equal(cf.category, 'CDN / Edge');
    assert.ok(cf.infrastructureMeaning.includes('fronted by Cloudflare edge'));
    assert.ok(cf.whatThisDoesNotProve?.includes('does not identify or prove the underlying origin'));

    // 3. Known Unknowns Verification
    assert.equal(cloudflareArchitecture.knownUnknowns[0].status, 'MASKED');
    assert.equal(cloudflareArchitecture.knownUnknowns[0].dimension, 'Origin Cloud Provider');
  });
});
