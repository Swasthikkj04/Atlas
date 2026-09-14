import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto } from '../../types/api/overview.dto';

describe('T10: Apache HTTP Server Workspace Vertical Experience Invariants', () => {
  it('verifies Apache architecture payload contains authoritative role, meaning, version, and anti-overreach claim boundaries', () => {
    const apacheArchitecture: TechnologyArchitectureOverviewDto = {
      architectureSummary:
        'The public endpoint appears to be served through an Apache HTTP Server gateway delivering a Django backend application.',
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
          technologyId: 'tech-apache',
          technologyName: 'Apache HTTP Server',
          role: 'Web Gateway / Web Server',
          relationshipType: 'PROXIES_TO',
        },
        {
          hop: 2,
          layer: 'APPLICATION',
          technologyId: 'tech-django',
          technologyName: 'Django',
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
              technologyId: 'tech-apache',
              name: 'Apache HTTP Server',
              category: 'Web / Server',
              layer: 'GATEWAY',
              role: 'Web Gateway / Web Server',
              infrastructureMeaning:
                'The public endpoint appears to use Apache HTTP Server to serve or participate in handling public HTTP traffic.',
              whyDetected: 'Observed Server: Apache/2.4.52 response header',
              whatThisDoesNotProve:
                'Apache presence does not prove Linux host OS, a particular distribution, PHP, Django, WordPress, Node.js, Docker, Kubernetes, AWS, GCP, Azure, or any specific downstream application architecture.',
              confidence: 0.99,
              confidenceLevel: 'HIGH',
              version: '2.4.52',
              evidence: [],
            },
          ],
        },
      ],
      keyTechnologies: [
        {
          technologyId: 'tech-apache',
          name: 'Apache HTTP Server',
          category: 'Web / Server',
          layer: 'GATEWAY',
          role: 'Web Gateway / Web Server',
          infrastructureMeaning:
            'The public endpoint appears to use Apache HTTP Server to serve or participate in handling public HTTP traffic.',
          whyDetected: 'Observed Server: Apache/2.4.52 response header',
          whatThisDoesNotProve:
            'Apache presence does not prove Linux host OS, a particular distribution, PHP, Django, WordPress, Node.js, Docker, Kubernetes, AWS, GCP, Azure, or any specific downstream application architecture.',
          confidence: 0.99,
          confidenceLevel: 'HIGH',
          version: '2.4.52',
          evidence: [],
        },
      ],
      integrations: [],
      knownUnknowns: [
        {
          dimension: 'Host Operating System',
          status: 'UNOBSERVED',
          explanation: 'Host OS and Linux distribution are unobservable from Server header alone.',
          whyUnknown: 'Web server banner does not disclose underlying host OS or kernel version.',
        },
        {
          dimension: 'Container Runtime',
          status: 'UNOBSERVED',
          explanation: 'Container runtime (Docker, Kubernetes) is unobservable without container API metadata.',
          whyUnknown: 'Apache serves HTTP requests without disclosing whether it runs in a container or bare metal.',
        },
      ],
      claimBoundaries: [
        {
          technologyId: 'tech-apache',
          technologyName: 'Apache HTTP Server',
          boundary:
            'Apache presence does not establish Linux host OS, PHP, Docker, AWS/GCP hosting, or private database.',
        },
      ],
      confidence: {
        overallLevel: 'HIGH',
        overallScore: 0.99,
        layerConfidence: { GATEWAY: 'HIGH' },
        rationale: 'Authoritative Server: Apache/2.4.52 header',
        confirmedRelationshipsCount: 2,
        supportedRelationshipsCount: 0,
        inferredRelationshipsCount: 0,
      },
    };

    // 1. Ingress Path Verification
    assert.equal(apacheArchitecture.ingressPath.length, 3);
    assert.equal(apacheArchitecture.ingressPath[1].technologyName, 'Apache HTTP Server');
    assert.equal(apacheArchitecture.ingressPath[1].layer, 'GATEWAY');

    // 2. Meaning, Version & Anti-Overreach Verification
    const apache = apacheArchitecture.keyTechnologies[0];
    assert.equal(apache.name, 'Apache HTTP Server');
    assert.equal(apache.category, 'Web / Server');
    assert.equal(apache.version, '2.4.52');
    assert.ok(apache.infrastructureMeaning.includes('handle public HTTP traffic') || apache.infrastructureMeaning.includes('handling public HTTP traffic'));
    assert.ok(apache.whatThisDoesNotProve?.includes('does not prove Linux host OS'));

    // 3. Known Unknowns Verification
    assert.equal(apacheArchitecture.knownUnknowns.length, 2);
    assert.equal(apacheArchitecture.knownUnknowns[0].status, 'UNOBSERVED');
    assert.equal(apacheArchitecture.knownUnknowns[0].dimension, 'Host Operating System');
  });
});
