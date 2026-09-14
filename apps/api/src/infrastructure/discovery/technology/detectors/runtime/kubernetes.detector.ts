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
export class KubernetesDetector extends BaseTechnologyDetector {
  readonly id = 'tech-kubernetes';
  readonly name = 'Kubernetes';
  readonly category = TechnologyCategory.RUNTIME;
  readonly description =
    'Kubernetes open-source container orchestration and cluster routing system';
  readonly role = 'Container Orchestration & Ingress';
  readonly infrastructureMeaning =
    'The public endpoint ingress is managed and routed by a Kubernetes cluster.';
  readonly detectionSignals = [
    'x-k8s- or kubernetes ingress response headers',
    'Ingress controller headers indicating k8s cluster topology',
  ];
  readonly confidenceRules =
    'HIGH confidence when x-k8s headers or Kubernetes ingress signatures are observed.';
  readonly whatThisDoesNotProve =
    'Kubernetes ingress routing does not prove physical cluster location or underlying cloud compute provider.';
  readonly defaultImplications = [
    'Ingress traffic is routed through a Kubernetes cluster ingress controller.',
    'Workloads are orchestrated across container pods with dynamic scaling.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasK8sHeader =
      context.hasHeader('x-k8s-cluster') ||
      context.hasHeader('x-k8s-ingress') ||
      context.hasHeader('x-kubernetes-ingress');

    if (hasK8sHeader) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-k8s-*',
        indicator: 'Kubernetes ingress controller routing header',
        observedValue:
          context.getHeader('x-k8s-cluster') ||
          context.getHeader('x-k8s-ingress') ||
          context.getHeader('x-kubernetes-ingress'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Kubernetes Ingress Header',
        type: 'HEADER',
        indicator: 'x-k8s',
        matched: true,
        weight: 10,
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
      role: `Container orchestration and cluster ingress for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
