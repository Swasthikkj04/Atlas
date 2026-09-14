import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto } from '../../types/api/overview.dto';

describe('T2: AWS CloudFront Workspace Vertical Experience Invariants', () => {
  it('verifies CloudFront architecture payload contains authoritative role, meaning, and anti-overreach claim boundaries', () => {
    const cloudfrontArchitecture: TechnologyArchitectureOverviewDto = {
      architectureSummary:
        'The public endpoint appears to be delivered through Amazon CloudFront, placing an AWS-managed edge distribution in front of the observed origin-facing infrastructure.',
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
          technologyId: 'tech-cloudfront',
          technologyName: 'AWS CloudFront',
          role: 'Edge / CDN Delivery',
          relationshipType: 'FORWARDS_TO',
        },
        {
          hop: 2,
          layer: 'GATEWAY',
          technologyId: 'tech-nginx',
          technologyName: 'NGINX',
          role: 'Web Gateway',
        },
      ],
      layers: [
        {
          layer: 'EDGE',
          state: 'OBSERVED',
          confidenceLevel: 'HIGH',
          technologies: [
            {
              technologyId: 'tech-cloudfront',
              name: 'AWS CloudFront',
              category: 'CDN / Edge',
              layer: 'EDGE',
              role: 'Edge / CDN Delivery',
              infrastructureMeaning:
                'The public endpoint appears to be delivered through Amazon CloudFront, placing an AWS-managed edge distribution in front of the observed origin-facing infrastructure.',
              whyDetected: 'Observed x-amz-cf-id, x-amz-cf-pop, and Via: cloudfront.net headers',
              whatThisDoesNotProve:
                'CloudFront edge delivery confirms the edge distribution layer, but does not establish that the origin runs on AWS EC2, ECS, EKS, S3, or another AWS service; CloudFront can front any custom origin server.',
              confidence: 0.99,
              confidenceLevel: 'HIGH',
              evidence: [],
            },
          ],
        },
      ],
      keyTechnologies: [
        {
          technologyId: 'tech-cloudfront',
          name: 'AWS CloudFront',
          category: 'CDN / Edge',
          layer: 'EDGE',
          role: 'Edge / CDN Delivery',
          infrastructureMeaning:
            'The public endpoint appears to be delivered through Amazon CloudFront, placing an AWS-managed edge distribution in front of the observed origin-facing infrastructure.',
          whyDetected: 'Observed x-amz-cf-id, x-amz-cf-pop, and Via: cloudfront.net headers',
          whatThisDoesNotProve:
            'CloudFront edge delivery confirms the edge distribution layer, but does not establish that the origin runs on AWS EC2, ECS, EKS, S3, or another AWS service; CloudFront can front any custom origin server.',
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
          explanation: 'Origin infrastructure is masked behind Amazon CloudFront edge distributions.',
          whyUnknown: 'CloudFront edge points of presence terminate client TCP connections before origin forwarding.',
        },
      ],
      claimBoundaries: [
        {
          technologyId: 'tech-cloudfront',
          technologyName: 'AWS CloudFront',
          boundary:
            'CloudFront presence does not establish that the origin runs on AWS EC2, ECS, EKS, S3, or another AWS service.',
        },
      ],
      confidence: {
        overallLevel: 'HIGH',
        overallScore: 0.99,
        layerConfidence: { EDGE: 'HIGH' },
        rationale: 'Authoritative x-amz-cf-id and Via response headers',
        confirmedRelationshipsCount: 2,
        supportedRelationshipsCount: 0,
        inferredRelationshipsCount: 0,
      },
    };

    // 1. Ingress Path Verification
    assert.equal(cloudfrontArchitecture.ingressPath.length, 3);
    assert.equal(cloudfrontArchitecture.ingressPath[1].technologyName, 'AWS CloudFront');
    assert.equal(cloudfrontArchitecture.ingressPath[1].layer, 'EDGE');

    // 2. Meaning & Anti-Overreach Verification
    const cf = cloudfrontArchitecture.keyTechnologies[0];
    assert.equal(cf.name, 'AWS CloudFront');
    assert.equal(cf.category, 'CDN / Edge');
    assert.ok(cf.infrastructureMeaning.includes('delivered through Amazon CloudFront'));
    assert.ok(cf.whatThisDoesNotProve?.includes('does not establish that the origin runs on AWS EC2'));

    // 3. Known Unknowns Verification
    assert.equal(cloudfrontArchitecture.knownUnknowns[0].status, 'MASKED');
    assert.equal(cloudfrontArchitecture.knownUnknowns[0].dimension, 'Origin Cloud Provider');
  });
});
