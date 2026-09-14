import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto } from '../../types/api/overview.dto';

describe('T12: WordPress Workspace Vertical Experience Invariants', () => {
  it('verifies WordPress architecture payload contains authoritative role, meaning, version, and anti-overreach claim boundaries', () => {
    const wpArchitecture: TechnologyArchitectureOverviewDto = {
      architectureSummary:
        'The public endpoint appears to be served through an NGINX reverse proxy gateway delivering a WordPress CMS application running on a PHP runtime.',
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
          role: 'Application / Content Management Platform',
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
          layer: 'APPLICATION',
          state: 'OBSERVED',
          confidenceLevel: 'HIGH',
          technologies: [
            {
              technologyId: 'tech-wordpress',
              name: 'WordPress',
              category: 'Content Management',
              layer: 'APPLICATION',
              role: 'Application / Content Management Platform',
              infrastructureMeaning:
                'The observed endpoint appears to use WordPress as part of its application/content-delivery architecture.',
              whyDetected: 'Observed /wp-content/ asset paths, WordPress generator meta tag, and wordpress_test_cookie',
              whatThisDoesNotProve:
                'WordPress presence does not by itself prove the exact PHP version, database engine, hosting provider, Linux distribution, Docker/Kubernetes deployment, Apache/NGINX usage, specific plugins, theme architecture, or administrative configuration.',
              confidence: 0.98,
              confidenceLevel: 'HIGH',
              version: '6.4.2',
              evidence: [],
            },
          ],
        },
      ],
      keyTechnologies: [
        {
          technologyId: 'tech-wordpress',
          name: 'WordPress',
          category: 'Content Management',
          layer: 'APPLICATION',
          role: 'Application / Content Management Platform',
          infrastructureMeaning:
            'The observed endpoint appears to use WordPress as part of its application/content-delivery architecture.',
          whyDetected: 'Observed /wp-content/ asset paths, WordPress generator meta tag, and wordpress_test_cookie',
          whatThisDoesNotProve:
            'WordPress presence does not by itself prove the exact PHP version, database engine, hosting provider, Linux distribution, Docker/Kubernetes deployment, Apache/NGINX usage, specific plugins, theme architecture, or administrative configuration.',
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          version: '6.4.2',
          evidence: [],
        },
      ],
      integrations: [],
      knownUnknowns: [
        {
          dimension: 'Database Backend',
          status: 'UNOBSERVED',
          explanation: 'Database engine (MySQL, MariaDB) is unobservable from public HTTP/HTML responses.',
          whyUnknown: 'Database connection configuration is executed privately on the server side.',
        },
        {
          dimension: 'Installed Plugins & Theme Architecture',
          status: 'UNOBSERVED',
          explanation: 'Complete plugin registry and theme configuration are unobservable from basic public page responses.',
          whyUnknown: 'Private administrative plugins and backend hooks do not expose public markers.',
        },
      ],
      claimBoundaries: [
        {
          technologyId: 'tech-wordpress',
          technologyName: 'WordPress',
          boundary:
            'WordPress presence does not establish MySQL, Apache, NGINX, Linux host OS, or cloud provider.',
        },
      ],
      confidence: {
        overallLevel: 'HIGH',
        overallScore: 0.98,
        layerConfidence: { APPLICATION: 'HIGH' },
        rationale: 'Authoritative /wp-content/ asset paths and generator meta tag',
        confirmedRelationshipsCount: 3,
        supportedRelationshipsCount: 0,
        inferredRelationshipsCount: 0,
      },
    };

    // 1. Ingress Path Verification
    assert.equal(wpArchitecture.ingressPath.length, 4);
    assert.equal(wpArchitecture.ingressPath[2].technologyName, 'WordPress');
    assert.equal(wpArchitecture.ingressPath[2].layer, 'APPLICATION');

    // 2. Meaning, Version & Anti-Overreach Verification
    const wp = wpArchitecture.keyTechnologies[0];
    assert.equal(wp.name, 'WordPress');
    assert.equal(wp.category, 'Content Management');
    assert.equal(wp.version, '6.4.2');
    assert.ok(wp.infrastructureMeaning.includes('application/content-delivery architecture'));
    assert.ok(wp.whatThisDoesNotProve?.includes('does not by itself prove the exact PHP version'));

    // 3. Known Unknowns Verification
    assert.equal(wpArchitecture.knownUnknowns.length, 2);
    assert.equal(wpArchitecture.knownUnknowns[0].status, 'UNOBSERVED');
    assert.equal(wpArchitecture.knownUnknowns[0].dimension, 'Database Backend');
  });
});
