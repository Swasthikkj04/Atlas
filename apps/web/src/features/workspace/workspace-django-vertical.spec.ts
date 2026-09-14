import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto } from '../../types/api/overview.dto';

describe('T6: Django Workspace Vertical Experience Invariants', () => {
  it('verifies Django architecture payload contains authoritative role, meaning, and anti-overreach claim boundaries', () => {
    const djangoArchitecture: TechnologyArchitectureOverviewDto = {
      architectureSummary:
        'The public endpoint appears to be routed through an NGINX reverse proxy gateway before reaching a Django application backend.',
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
          technologyId: 'tech-django',
          technologyName: 'Django',
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
              technologyId: 'tech-django',
              name: 'Django',
              category: 'Frameworks',
              layer: 'APPLICATION',
              role: 'Application Framework',
              infrastructureMeaning:
                'The observed endpoint appears to use Django for server-side application request handling and application delivery.',
              whyDetected: 'Observed csrftoken cookie in Set-Cookie header and csrfmiddlewaretoken HTML form input',
              whatThisDoesNotProve:
                'Django presence confirms server-side application framework, but does not prove WSGI/ASGI application server (Gunicorn/uWSGI), Python version, container runtime (Docker/Kubernetes), cloud provider, or database backend.',
              confidence: 0.95,
              confidenceLevel: 'HIGH',
              evidence: [],
            },
          ],
        },
      ],
      keyTechnologies: [
        {
          technologyId: 'tech-django',
          name: 'Django',
          category: 'Frameworks',
          layer: 'APPLICATION',
          role: 'Application Framework',
          infrastructureMeaning:
            'The observed endpoint appears to use Django for server-side application request handling and application delivery.',
          whyDetected: 'Observed csrftoken cookie in Set-Cookie header and csrfmiddlewaretoken HTML form input',
          whatThisDoesNotProve:
            'Django presence confirms server-side application framework, but does not prove WSGI/ASGI application server (Gunicorn/uWSGI), Python version, container runtime (Docker/Kubernetes), cloud provider, or database backend.',
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          evidence: [],
        },
      ],
      integrations: [],
      knownUnknowns: [
        {
          dimension: 'Database Backend',
          status: 'UNOBSERVED',
          explanation: 'Backend relational database (e.g. PostgreSQL, MySQL) is unobservable from public HTTP/HTML telemetry.',
          whyUnknown: 'Django application executes queries internally without disclosing database connection details in public responses.',
        },
        {
          dimension: 'Application Server / WSGI',
          status: 'UNOBSERVED',
          explanation: 'Underlying WSGI/ASGI server (Gunicorn, uWSGI) is not exposed in public response headers.',
          whyUnknown: 'Web gateway terminates public HTTP connections and proxies to upstream socket cleanly.',
        },
      ],
      claimBoundaries: [
        {
          technologyId: 'tech-django',
          technologyName: 'Django',
          boundary:
            'Django presence does not establish Gunicorn/uWSGI, Docker, Kubernetes, AWS/GCP hosting, or database engine.',
        },
      ],
      confidence: {
        overallLevel: 'HIGH',
        overallScore: 0.95,
        layerConfidence: { APPLICATION: 'HIGH' },
        rationale: 'Authoritative csrftoken cookie and csrfmiddlewaretoken template signature',
        confirmedRelationshipsCount: 2,
        supportedRelationshipsCount: 0,
        inferredRelationshipsCount: 0,
      },
    };

    // 1. Ingress Path Verification
    assert.equal(djangoArchitecture.ingressPath.length, 3);
    assert.equal(djangoArchitecture.ingressPath[2].technologyName, 'Django');
    assert.equal(djangoArchitecture.ingressPath[2].layer, 'APPLICATION');

    // 2. Meaning & Anti-Overreach Verification
    const django = djangoArchitecture.keyTechnologies[0];
    assert.equal(django.name, 'Django');
    assert.equal(django.category, 'Frameworks');
    assert.ok(django.infrastructureMeaning.includes('server-side application request handling'));
    assert.ok(django.whatThisDoesNotProve?.includes('does not prove WSGI/ASGI application server'));

    // 3. Known Unknowns Verification
    assert.equal(djangoArchitecture.knownUnknowns.length, 2);
    assert.equal(djangoArchitecture.knownUnknowns[0].status, 'UNOBSERVED');
    assert.equal(djangoArchitecture.knownUnknowns[0].dimension, 'Database Backend');
  });
});
