import { Injectable } from '@nestjs/common';
import { BaseTechnologyDetector } from '../../base/base-technology.detector';
import {
  TechnologyCategory,
  TechnologyDetectionContext,
  TechnologyDetectionResult,
  TechnologyEvidence,
  TechnologySignal,
} from '../../contracts';

@Injectable()
export class DockerDetector extends BaseTechnologyDetector {
  readonly id = 'tech-docker';
  readonly name = 'Docker';
  readonly category = TechnologyCategory.RUNTIME;
  readonly description =
    'Docker is a containerization platform used to package and run application workloads in isolated containers';
  readonly role = 'Container Runtime & Packaging';
  readonly infrastructureMeaning =
    'Nebula observed evidence consistent with Docker-based containerization at the runtime boundary.';
  readonly detectionSignals = [
    'docker-distribution-api-version response header',
    'x-docker-registry-version response header',
    'x-docker-container-id response header',
    'Server or custom proxy headers exposing Docker container runtime metadata',
  ];
  readonly confidenceRules =
    'HIGH confidence when docker-distribution-api-version, x-docker-*, or Docker API registry headers are observed.';
  readonly whatThisDoesNotProve =
    'Docker presence does not prove Kubernetes, ECS, EKS, Docker Swarm, AWS/GCP/Azure hosting, cloud provider, Linux host OS, a particular container image, or that the entire application runs inside Docker.';
  readonly defaultImplications = [
    'Observable services participate in a Docker container packaging or runtime distribution boundary.',
    'Workloads utilize containerized encapsulation standards.',
    'Underlying container orchestrator, host operating system, and cloud provider remain unobservable from public telemetry.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasDockerDistApi = context.hasHeader(
      'docker-distribution-api-version',
    );
    const hasDockerRegVersion = context.hasHeader('x-docker-registry-version');
    const hasDockerContainerId = context.hasHeader('x-docker-container-id');

    if (hasDockerDistApi) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: docker-distribution-api-version',
        indicator: 'Docker Registry v2 API distribution version header',
        observedValue: context.getHeader('docker-distribution-api-version'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Docker Distribution API Header',
        type: 'HEADER',
        indicator: 'docker-distribution-api-version',
        matched: true,
        weight: 10,
      });
    }

    if (hasDockerRegVersion) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-docker-registry-version',
        indicator: 'Docker registry version header',
        observedValue: context.getHeader('x-docker-registry-version'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Docker Registry Header',
        type: 'HEADER',
        indicator: 'x-docker-registry-version',
        matched: true,
        weight: 10,
      });
    }

    if (hasDockerContainerId) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-docker-container-id',
        indicator: 'Docker container ID exposure header',
        observedValue: context.getHeader('x-docker-container-id'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Docker Container ID Header',
        type: 'HEADER',
        indicator: 'x-docker-container-id',
        matched: true,
        weight: 9,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.95,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Containerized application runtime and packaging for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
