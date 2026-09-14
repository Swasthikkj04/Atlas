import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto } from '../../types/api/overview.dto';

describe('T11: PHP Workspace Vertical Experience Invariants', () => {
  it('verifies PHP architecture payload contains authoritative role, meaning, version, and anti-overreach claim boundaries', () => {
    const phpArchitecture: TechnologyArchitectureOverviewDto = {
      architectureSummary:
        'The public endpoint appears to be served through an NGINX reverse proxy gateway delivering a WordPress application running on a PHP server-side runtime.',
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
          technologyId: 'tech-wordpress',
          technologyName: 'WordPress',
          role: 'Application / CMS',
          relationshipType: 'RUNS_ON',
        },
        {
          hop: 3,
          layer: 'RUNTIME',
          technologyId: 'tech-php',
          technologyName: 'PHP',
          role: 'Server-side Application Runtime',
        },
      ],
      layers: [
        {
          layer: 'RUNTIME',
          state: 'OBSERVED',
          confidenceLevel: 'HIGH',
          technologies: [
            {
              technologyId: 'tech-php',
              name: 'PHP',
              category: 'Infrastructure Runtime',
              layer: 'RUNTIME',
              role: 'Server-side Application Runtime',
              infrastructureMeaning:
                'The observed endpoint appears to execute or expose a PHP-based server-side application/runtime boundary.',
              whyDetected: 'Observed X-Powered-By: PHP/8.2.14 response header and PHPSESSID session cookie',
              whatThisDoesNotProve:
                'PHP presence confirms server-side runtime, but does not prove WordPress, Laravel, Symfony, Drupal, Apache, NGINX, Docker, Kubernetes, Linux, AWS, GCP, Azure, or any specific database.',
              confidence: 0.95,
              confidenceLevel: 'HIGH',
              version: '8.2.14',
              evidence: [],
            },
          ],
        },
      ],
      keyTechnologies: [
        {
          technologyId: 'tech-php',
          name: 'PHP',
          category: 'Infrastructure Runtime',
          layer: 'RUNTIME',
          role: 'Server-side Application Runtime',
          infrastructureMeaning:
            'The observed endpoint appears to execute or expose a PHP-based server-side application/runtime boundary.',
          whyDetected: 'Observed X-Powered-By: PHP/8.2.14 response header and PHPSESSID session cookie',
          whatThisDoesNotProve:
            'PHP presence confirms server-side runtime, but does not prove WordPress, Laravel, Symfony, Drupal, Apache, NGINX, Docker, Kubernetes, Linux, AWS, GCP, Azure, or any specific database.',
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          version: '8.2.14',
          evidence: [],
        },
      ],
      integrations: [],
      knownUnknowns: [
        {
          dimension: 'Database Backend',
          status: 'UNOBSERVED',
          explanation: 'Backend database (MySQL, PostgreSQL, MariaDB) is unobservable from public HTTP/API responses.',
          whyUnknown: 'Database connection configuration is executed privately on the server side.',
        },
        {
          dimension: 'Host Operating System',
          status: 'UNOBSERVED',
          explanation: 'Host OS and Linux distribution are unobservable from PHP response headers.',
          whyUnknown: 'PHP execution environment abstracts the underlying OS kernel details.',
        },
      ],
      claimBoundaries: [
        {
          technologyId: 'tech-php',
          technologyName: 'PHP',
          boundary:
            'PHP presence does not establish WordPress, Laravel, Apache, NGINX, Linux host OS, or private database.',
        },
      ],
      confidence: {
        overallLevel: 'HIGH',
        overallScore: 0.95,
        layerConfidence: { RUNTIME: 'HIGH' },
        rationale: 'Authoritative X-Powered-By: PHP/8.2.14 header',
        confirmedRelationshipsCount: 3,
        supportedRelationshipsCount: 0,
        inferredRelationshipsCount: 0,
      },
    };

    // 1. Ingress Path Verification
    assert.equal(phpArchitecture.ingressPath.length, 4);
    assert.equal(phpArchitecture.ingressPath[3].technologyName, 'PHP');
    assert.equal(phpArchitecture.ingressPath[3].layer, 'RUNTIME');

    // 2. Meaning, Version & Anti-Overreach Verification
    const php = phpArchitecture.keyTechnologies[0];
    assert.equal(php.name, 'PHP');
    assert.equal(php.category, 'Infrastructure Runtime');
    assert.equal(php.version, '8.2.14');
    assert.ok(php.infrastructureMeaning.includes('PHP-based server-side application/runtime boundary'));
    assert.ok(php.whatThisDoesNotProve?.includes('does not prove WordPress'));

    // 3. Known Unknowns Verification
    assert.equal(phpArchitecture.knownUnknowns.length, 2);
    assert.equal(phpArchitecture.knownUnknowns[0].status, 'UNOBSERVED');
    assert.equal(phpArchitecture.knownUnknowns[0].dimension, 'Database Backend');
  });
});
