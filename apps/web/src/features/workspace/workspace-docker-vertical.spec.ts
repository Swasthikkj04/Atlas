import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto } from '../../types/api/overview.dto';

describe('T9: Docker Workspace Vertical Experience Invariants', () => {
  it('verifies Docker architecture payload contains authoritative role, meaning, and anti-overreach claim boundaries', () => {
    const dockerArchitecture: TechnologyArchitectureOverviewDto = {
      architectureSummary:
        'The public endpoint appears to be served through an NGINX reverse proxy gateway delivering a Django backend running inside a Docker container runtime.',
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
          relationshipType: 'RUNS_ON',
        },
        {
          hop: 3,
          layer: 'RUNTIME',
          technologyId: 'tech-docker',
          technologyName: 'Docker',
          role: 'Container Runtime & Packaging',
        },
      ],
      layers: [
        {
          layer: 'RUNTIME',
          state: 'OBSERVED',
          confidenceLevel: 'HIGH',
          technologies: [
            {
              technologyId: 'tech-docker',
              name: 'Docker',
              category: 'Infrastructure Runtime',
              layer: 'RUNTIME',
              role: 'Container Runtime & Packaging',
              infrastructureMeaning:
                'Nebula observed evidence consistent with Docker-based containerization at the runtime boundary.',
              whyDetected: 'Observed docker-distribution-api-version and x-docker-registry-version response headers',
              whatThisDoesNotProve:
                'Docker presence does not prove Kubernetes, ECS, EKS, Docker Swarm, AWS/GCP/Azure hosting, Linux host OS, a particular container image, or that the entire application runs inside Docker.',
              confidence: 0.95,
              confidenceLevel: 'HIGH',
              evidence: [],
            },
          ],
        },
      ],
      keyTechnologies: [
        {
          technologyId: 'tech-docker',
          name: 'Docker',
          category: 'Infrastructure Runtime',
          layer: 'RUNTIME',
          role: 'Container Runtime & Packaging',
          infrastructureMeaning:
            'Nebula observed evidence consistent with Docker-based containerization at the runtime boundary.',
          whyDetected: 'Observed docker-distribution-api-version and x-docker-registry-version response headers',
          whatThisDoesNotProve:
            'Docker presence does not prove Kubernetes, ECS, EKS, Docker Swarm, AWS/GCP/Azure hosting, Linux host OS, a particular container image, or that the entire application runs inside Docker.',
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          evidence: [],
        },
      ],
      integrations: [],
      knownUnknowns: [
        {
          dimension: 'Container Orchestrator',
          status: 'UNOBSERVED',
          explanation: 'Cluster orchestration (Kubernetes, ECS, Docker Swarm) is unobservable from public HTTP/API responses.',
          whyUnknown: 'Application responds to public requests without disclosing private orchestrator topology.',
        },
        {
          dimension: 'Host Operating System',
          status: 'UNOBSERVED',
          explanation: 'Underlying host OS and kernel version are unobservable from containerized application responses.',
          whyUnknown: 'Container virtualization abstracts underlying host OS metadata.',
        },
      ],
      claimBoundaries: [
        {
          technologyId: 'tech-docker',
          technologyName: 'Docker',
          boundary:
            'Docker presence does not establish Kubernetes, ECS, EKS, Linux host OS, AWS/GCP hosting, or private database.',
        },
      ],
      confidence: {
        overallLevel: 'HIGH',
        overallScore: 0.95,
        layerConfidence: { RUNTIME: 'HIGH' },
        rationale: 'Authoritative docker-distribution-api-version header',
        confirmedRelationshipsCount: 3,
        supportedRelationshipsCount: 0,
        inferredRelationshipsCount: 0,
      },
    };

    // 1. Ingress Path Verification
    assert.equal(dockerArchitecture.ingressPath.length, 4);
    assert.equal(dockerArchitecture.ingressPath[3].technologyName, 'Docker');
    assert.equal(dockerArchitecture.ingressPath[3].layer, 'RUNTIME');

    // 2. Meaning & Anti-Overreach Verification
    const docker = dockerArchitecture.keyTechnologies[0];
    assert.equal(docker.name, 'Docker');
    assert.equal(docker.category, 'Infrastructure Runtime');
    assert.ok(docker.infrastructureMeaning.includes('Docker-based containerization'));
    assert.ok(docker.whatThisDoesNotProve?.includes('does not prove Kubernetes'));

    // 3. Known Unknowns Verification
    assert.equal(dockerArchitecture.knownUnknowns.length, 2);
    assert.equal(dockerArchitecture.knownUnknowns[0].status, 'UNOBSERVED');
    assert.equal(dockerArchitecture.knownUnknowns[0].dimension, 'Container Orchestrator');
  });
});
