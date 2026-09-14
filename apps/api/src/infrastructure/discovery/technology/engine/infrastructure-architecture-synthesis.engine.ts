import { Injectable, Logger } from '@nestjs/common';
import {
  InfrastructureTopology,
  TechnologyDetectionContext,
  InfrastructureArchitectureBrief,
  ArchitecturePathSegment,
  ArchitectureLayerSummary,
  TechnologyArchitectureSummary,
  ArchitectureConfidenceSummary,
  ArchitectureUnknown,
  ClaimBoundary,
  TopologyLayer,
  TopologyNode,
  TechnologyConfidenceLevel,
  TechnologyEvidence,
  TechnologyRelationshipType,
} from '../contracts';

@Injectable()
export class InfrastructureArchitectureSynthesisEngine {
  private readonly logger = new Logger(
    InfrastructureArchitectureSynthesisEngine.name,
  );

  async synthesize(
    topology: InfrastructureTopology,
    context: TechnologyDetectionContext,
  ): Promise<InfrastructureArchitectureBrief> {
    // 1. Construct the best-supported linear architecture path
    const architecturePath = this.buildArchitecturePath(topology, context);

    // 2. Synthesize structured layer-by-layer breakdowns
    const layers = this.buildLayerSummaries(topology);

    // 3. Separate key core technologies from external integrations
    const { keyTechnologies, integrations } =
      this.categorizeTechnologies(topology);

    // 4. Consolidate evidence lineage
    const evidence = this.collectEvidence(topology);

    // 5. Synthesize multi-dimensional confidence breakdown
    const confidence = this.synthesizeConfidence(topology);

    // 6. Explicitly identify architectural unknowns (first-class trust model)
    const knownUnknowns = this.synthesizeKnownUnknowns(topology, context);

    // 7. Extract anti-overreach claim boundaries
    const claimBoundaries = this.extractClaimBoundaries(topology);

    // 8. Generate deterministic human-readable executive summary
    const summary = this.generateSummary(topology, context);

    this.logger.debug(
      `Synthesized architecture brief for ${context.domainName}: ${architecturePath.length} path hops, ${layers.filter((l) => l.state === 'OBSERVED').length} observed layers, confidence=${confidence.overallLevel}`,
    );

    return {
      summary,
      architecturePath,
      layers,
      keyTechnologies,
      integrations,
      evidence,
      confidence,
      knownUnknowns,
      claimBoundaries,
      generatedAt: new Date().toISOString(),
    };
  }

  private buildArchitecturePath(
    topology: InfrastructureTopology,
    context: TechnologyDetectionContext,
  ): ArchitecturePathSegment[] {
    const path: ArchitecturePathSegment[] = [];

    // Hop 0: Public Endpoint Entrypoint
    path.push({
      hop: 0,
      layer: TopologyLayer.EDGE,
      technologyId: 'public-endpoint',
      technologyName: `Public Endpoint (${context.domainName})`,
      role: 'Client Request Ingress',
      relationshipType: TechnologyRelationshipType.EDGE_OF,
    });

    let hopCounter = 1;

    // Layer 1: Edge CDN / WAF / Anycast
    const edgeNodes = topology.layers[TopologyLayer.EDGE];
    if (edgeNodes && edgeNodes.length > 0) {
      for (const node of edgeNodes) {
        path.push({
          hop: hopCounter++,
          layer: TopologyLayer.EDGE,
          technologyId: node.id,
          technologyName: node.name,
          role: node.role,
          relationshipType: TechnologyRelationshipType.EDGE_OF,
          evidenceState: 'CONFIRMED',
        });
      }
    }

    // Layer 2: Managed Platform (if applicable)
    const platformNodes = topology.layers[TopologyLayer.PLATFORM];
    if (platformNodes && platformNodes.length > 0) {
      for (const node of platformNodes) {
        path.push({
          hop: hopCounter++,
          layer: TopologyLayer.PLATFORM,
          technologyId: node.id,
          technologyName: node.name,
          role: node.role,
          relationshipType: TechnologyRelationshipType.SERVES,
          evidenceState: 'CONFIRMED',
        });
      }
    }

    // Layer 3: Web Gateway / Reverse Proxy
    const gatewayNodes = topology.layers[TopologyLayer.GATEWAY];
    if (gatewayNodes && gatewayNodes.length > 0) {
      for (const node of gatewayNodes) {
        path.push({
          hop: hopCounter++,
          layer: TopologyLayer.GATEWAY,
          technologyId: node.id,
          technologyName: node.name,
          role: node.role,
          relationshipType: TechnologyRelationshipType.PROXIES_TO,
          evidenceState: 'SUPPORTED',
        });
      }
    }

    // Layer 4: Application Framework / Backend
    const appNodes = topology.layers[TopologyLayer.APPLICATION];
    if (appNodes && appNodes.length > 0) {
      for (const node of appNodes) {
        path.push({
          hop: hopCounter++,
          layer: TopologyLayer.APPLICATION,
          technologyId: node.id,
          technologyName: node.name,
          role: node.role,
          relationshipType: TechnologyRelationshipType.RUNS_ON,
          evidenceState: 'SUPPORTED',
        });
      }
    }

    // Layer 5: Container Runtime / Cluster Substrate
    const runtimeNodes = topology.layers[TopologyLayer.RUNTIME];
    if (runtimeNodes && runtimeNodes.length > 0) {
      for (const node of runtimeNodes) {
        path.push({
          hop: hopCounter++,
          layer: TopologyLayer.RUNTIME,
          technologyId: node.id,
          technologyName: node.name,
          role: node.role,
          relationshipType: TechnologyRelationshipType.RUNS_ON,
          evidenceState: 'SUPPORTED',
        });
      }
    }

    return path;
  }

  private buildLayerSummaries(
    topology: InfrastructureTopology,
  ): ArchitectureLayerSummary[] {
    const allLayers: { layer: TopologyLayer; name: string }[] = [
      { layer: TopologyLayer.EDGE, name: 'Edge & CDN Layer' },
      { layer: TopologyLayer.GATEWAY, name: 'Web Gateway & Ingress Layer' },
      { layer: TopologyLayer.APPLICATION, name: 'Application Framework Layer' },
      { layer: TopologyLayer.RUNTIME, name: 'Container & Runtime Layer' },
      { layer: TopologyLayer.PLATFORM, name: 'Platform & CMS Layer' },
      {
        layer: TopologyLayer.INTEGRATION,
        name: 'Third-Party Integration Layer',
      },
      { layer: TopologyLayer.SECURITY, name: 'Security & Policy Layer' },
    ];

    return allLayers.map(({ layer, name }) => {
      const nodes = topology.layers[layer] || [];
      const isObserved = nodes.length > 0;

      const technologies: TechnologyArchitectureSummary[] = nodes.map((node) =>
        this.mapNodeToArchitectureSummary(node, topology),
      );

      const confidenceLevel: TechnologyConfidenceLevel = isObserved
        ? nodes.some((n) => n.confidenceLevel === 'HIGH')
          ? 'HIGH'
          : 'MEDIUM'
        : 'INCONCLUSIVE';

      const description = isObserved
        ? `${name} is active with ${nodes.map((n) => n.name).join(', ')} participating in request processing.`
        : `${name} is unobserved or masked from the public endpoint surface.`;

      return {
        layer,
        name,
        state: isObserved ? 'OBSERVED' : 'UNOBSERVED',
        confidenceLevel,
        technologies,
        description,
      };
    });
  }

  private categorizeTechnologies(topology: InfrastructureTopology): {
    keyTechnologies: TechnologyArchitectureSummary[];
    integrations: TechnologyArchitectureSummary[];
  } {
    const keyTechnologies: TechnologyArchitectureSummary[] = [];
    const integrations: TechnologyArchitectureSummary[] = [];

    for (const node of topology.nodes) {
      const summary = this.mapNodeToArchitectureSummary(node, topology);

      if (node.layer === TopologyLayer.INTEGRATION) {
        integrations.push(summary);
      } else {
        keyTechnologies.push(summary);
      }
    }

    return { keyTechnologies, integrations };
  }

  private mapNodeToArchitectureSummary(
    node: TopologyNode,
    topology: InfrastructureTopology,
  ): TechnologyArchitectureSummary {
    const relatedEvidence: TechnologyEvidence[] = [];

    for (const rel of topology.relationships) {
      if (
        rel.sourceTechnologyId === node.id ||
        rel.targetTechnologyId === node.id
      ) {
        relatedEvidence.push(...rel.evidence);
      }
    }

    return {
      technologyId: node.id,
      name: node.name,
      category: String(node.category),
      layer: node.layer,
      role: node.role,
      infrastructureMeaning: node.infrastructureMeaning,
      whyDetected: node.whyDetected,
      confidence: node.confidence,
      confidenceLevel: node.confidenceLevel,
      version: node.version,
      whatThisDoesNotProve: node.whatThisDoesNotProve,
      implications: node.implications,
      evidence: relatedEvidence,
    };
  }

  private collectEvidence(
    topology: InfrastructureTopology,
  ): TechnologyEvidence[] {
    const evidenceMap = new Map<string, TechnologyEvidence>();

    for (const rel of topology.relationships) {
      for (const ev of rel.evidence) {
        const key = `${ev.sourceType}:${ev.source}:${ev.indicator}`;
        if (!evidenceMap.has(key)) {
          evidenceMap.set(key, ev);
        }
      }
    }

    return Array.from(evidenceMap.values());
  }

  private synthesizeConfidence(
    topology: InfrastructureTopology,
  ): ArchitectureConfidenceSummary {
    const layerConfidence: Record<TopologyLayer, TechnologyConfidenceLevel> = {
      [TopologyLayer.EDGE]: this.getLayerConfidence(
        topology.layers[TopologyLayer.EDGE],
      ),
      [TopologyLayer.GATEWAY]: this.getLayerConfidence(
        topology.layers[TopologyLayer.GATEWAY],
      ),
      [TopologyLayer.APPLICATION]: this.getLayerConfidence(
        topology.layers[TopologyLayer.APPLICATION],
      ),
      [TopologyLayer.RUNTIME]: this.getLayerConfidence(
        topology.layers[TopologyLayer.RUNTIME],
      ),
      [TopologyLayer.PLATFORM]: this.getLayerConfidence(
        topology.layers[TopologyLayer.PLATFORM],
      ),
      [TopologyLayer.INTEGRATION]: this.getLayerConfidence(
        topology.layers[TopologyLayer.INTEGRATION],
      ),
      [TopologyLayer.SECURITY]: this.getLayerConfidence(
        topology.layers[TopologyLayer.SECURITY],
      ),
    };

    if (topology.nodes.length === 0) {
      return {
        overallLevel: 'INCONCLUSIVE',
        overallScore: 0,
        layerConfidence,
        rationale:
          'No public technologies were detected to evaluate confidence.',
        confirmedRelationshipsCount: 0,
        supportedRelationshipsCount: 0,
        inferredRelationshipsCount: 0,
      };
    }

    const avgNodeConfidence =
      topology.nodes.reduce((sum, n) => sum + n.confidence, 0) /
      topology.nodes.length;

    const confirmedWeight = topology.confirmedRelationshipsCount * 1.0;
    const supportedWeight = topology.supportedRelationshipsCount * 0.8;
    const inferredWeight = topology.inferredRelationshipsCount * 0.5;
    const totalRel = Math.max(1, topology.totalRelationships);

    const relScore =
      (confirmedWeight + supportedWeight + inferredWeight) / totalRel;

    const overallScore = Number(
      (avgNodeConfidence * 0.6 + relScore * 0.4).toFixed(2),
    );

    const overallLevel: TechnologyConfidenceLevel =
      overallScore >= 0.85 && topology.confirmedRelationshipsCount > 0
        ? 'HIGH'
        : overallScore >= 0.65
          ? 'MEDIUM'
          : 'LOW';

    const rationale = `Architecture confidence is ${overallLevel} (Score: ${overallScore}) derived from ${topology.totalNodes} detected nodes across observed layers with ${topology.confirmedRelationshipsCount} confirmed and ${topology.supportedRelationshipsCount} supported structural relationships.`;

    return {
      overallLevel,
      overallScore,
      layerConfidence,
      rationale,
      confirmedRelationshipsCount: topology.confirmedRelationshipsCount,
      supportedRelationshipsCount: topology.supportedRelationshipsCount,
      inferredRelationshipsCount: topology.inferredRelationshipsCount,
    };
  }

  private getLayerConfidence(
    nodes?: TopologyNode[],
  ): TechnologyConfidenceLevel {
    if (!nodes || nodes.length === 0) return 'INCONCLUSIVE';
    if (nodes.some((n) => n.confidenceLevel === 'HIGH')) return 'HIGH';
    if (nodes.some((n) => n.confidenceLevel === 'MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }

  private synthesizeKnownUnknowns(
    topology: InfrastructureTopology,
    context: TechnologyDetectionContext,
  ): ArchitectureUnknown[] {
    const unknowns: ArchitectureUnknown[] = [];

    const hasEdge = topology.layers[TopologyLayer.EDGE]?.length > 0;
    const hasRuntime = topology.layers[TopologyLayer.RUNTIME]?.length > 0;

    // Unknown 1: Origin Cloud Compute Provider
    if (hasEdge) {
      const edgeNames = topology.layers[TopologyLayer.EDGE]
        .map((n) => n.name)
        .join(', ');
      unknowns.push({
        dimension: 'Origin Cloud Provider',
        status: 'MASKED',
        explanation: `The underlying origin server hosting provider and physical server location are masked behind ${edgeNames} edge proxying.`,
        whyUnknown:
          'Anycast edge proxies terminate public client connections, hiding private upstream origin IP addresses.',
      });
    }

    // Unknown 2: Private Network & VPC Topology
    unknowns.push({
      dimension: 'Private Network & VPC Topology',
      status: 'UNOBSERVED',
      explanation: `Internal network topology, private subnets, and backend VPC routing for ${context.domainName} are unexposed.`,
      whyUnknown:
        'Non-intrusive public discovery only observes external edge and gateway ingress telemetry.',
    });

    // Unknown 3: Database Backend Layer
    unknowns.push({
      dimension: 'Database Backend Layer',
      status: 'UNOBSERVED',
      explanation:
        'Backend database engines (PostgreSQL, MySQL, MongoDB, DynamoDB) reside sealed behind application layers and are unobserved from public endpoints.',
      whyUnknown:
        'Database connections and cluster storage reside isolated behind application services.',
    });

    // Unknown 4: In-Memory Caching Tier
    unknowns.push({
      dimension: 'In-Memory Caching Tier',
      status: 'UNOBSERVED',
      explanation:
        'Internal caching tiers (Redis, Memcached, Key-Value stores) operate behind gateways and are not publicly exposed.',
      whyUnknown:
        'In-memory caches reside within internal private application perimeters.',
    });

    // Unknown 5: Cluster Orchestrator & Compute Substrate
    const hasOrchestrator = topology.nodes.some(
      (n) => n.id === 'tech-kubernetes' || n.id === 'tech-docker',
    );
    if (!hasOrchestrator) {
      unknowns.push({
        dimension: 'Cluster Orchestrator & Compute Substrate',
        status: 'UNOBSERVED',
        explanation:
          'Container schedulers and cluster orchestrators (Kubernetes, Docker Swarm, Nomad) reside within private VPC subnets without public ingress telemetry.',
        whyUnknown:
          'Orchestrator control planes and worker nodes are sealed behind public ingress gateways.',
      });
    }

    // Unknown 6: Host Operating System / Compute Architecture
    if (!hasRuntime) {
      unknowns.push({
        dimension: 'Host Operating System & Compute Architecture',
        status: 'UNKNOWN',
        explanation:
          'The underlying host operating system (e.g. Linux distribution) and hardware virtualization layer cannot be confirmed.',
        whyUnknown:
          'Public HTTP response headers do not expose low-level kernel or host machine banners.',
      });
    }

    return unknowns;
  }

  private extractClaimBoundaries(
    topology: InfrastructureTopology,
  ): ClaimBoundary[] {
    const boundaries: ClaimBoundary[] = [];
    const seen = new Set<string>();

    for (const node of topology.nodes) {
      if (node.whatThisDoesNotProve && !seen.has(node.whatThisDoesNotProve)) {
        seen.add(node.whatThisDoesNotProve);
        boundaries.push({
          technologyId: node.id,
          technologyName: node.name,
          boundary: node.whatThisDoesNotProve,
        });
      }
    }

    for (const rel of topology.relationships) {
      if (rel.claimBoundary && !seen.has(rel.claimBoundary)) {
        seen.add(rel.claimBoundary);
        boundaries.push({
          technologyId: rel.sourceTechnologyId,
          technologyName: rel.sourceTechnologyName,
          boundary: rel.claimBoundary,
        });
      }
    }

    return boundaries;
  }

  private generateSummary(
    topology: InfrastructureTopology,
    context: TechnologyDetectionContext,
  ): string {
    if (topology.nodes.length === 0) {
      return `No public application framework, gateway, or edge infrastructure technologies were observed for ${context.domainName}.`;
    }

    const edgeNodes = topology.layers[TopologyLayer.EDGE] || [];
    const gatewayNodes = topology.layers[TopologyLayer.GATEWAY] || [];
    const appNodes = topology.layers[TopologyLayer.APPLICATION] || [];
    const runtimeNodes = topology.layers[TopologyLayer.RUNTIME] || [];
    const platformNodes = topology.layers[TopologyLayer.PLATFORM] || [];
    const integrationNodes = topology.layers[TopologyLayer.INTEGRATION] || [];
    const securityNodes = topology.layers[TopologyLayer.SECURITY] || [];

    const sentences: string[] = [];

    // Sentence 1: Ingress / Edge / Gateway / Platform
    if (edgeNodes.length > 0 && gatewayNodes.length > 0) {
      const edgeNames = edgeNodes.map((n) => n.name).join(', ');
      const gatewayNames = gatewayNodes.map((n) => n.name).join(', ');
      sentences.push(
        `The public endpoint appears to be protected and served through ${edgeNames} as an edge layer, forwarding traffic toward ${gatewayNames} as an ingress gateway.`,
      );
    } else if (edgeNodes.length > 0 && platformNodes.length > 0) {
      const edgeNames = edgeNodes.map((n) => n.name).join(', ');
      const platformNames = platformNodes.map((n) => n.name).join(', ');
      sentences.push(
        `The public endpoint appears to be delivered and protected via ${edgeNames} edge infrastructure, fronting the ${platformNames} platform.`,
      );
    } else if (edgeNodes.length > 0) {
      const edgeNames = edgeNodes.map((n) => n.name).join(', ');
      sentences.push(
        `The public endpoint appears to be delivered and protected via ${edgeNames} edge infrastructure before requests reach origin services.`,
      );
    } else if (gatewayNodes.length > 0) {
      const gatewayNames = gatewayNodes.map((n) => n.name).join(', ');
      sentences.push(
        `Inbound traffic is received and routed through ${gatewayNames} as a web gateway and reverse proxy.`,
      );
    } else if (platformNodes.length > 0) {
      const platformNames = platformNodes.map((n) => n.name).join(', ');
      sentences.push(
        `The public endpoint is hosted on ${platformNames} managed cloud platform infrastructure.`,
      );
    }

    // Sentence 2: Application Framework & Runtime
    if (appNodes.length > 0 && runtimeNodes.length > 0) {
      const appNames = appNodes.map((n) => n.name).join(', ');
      const runtimeNames = runtimeNodes.map((n) => n.name).join(', ');
      sentences.push(
        `The observed application layer utilizes ${appNames}, executing inside ${runtimeNames} containerized environments.`,
      );
    } else if (appNodes.length > 0) {
      const appNames = appNodes.map((n) => n.name).join(', ');
      sentences.push(
        `The application layer appears to use ${appNames} for request handling and presentation.`,
      );
    } else if (runtimeNodes.length > 0) {
      const runtimeNames = runtimeNodes.map((n) => n.name).join(', ');
      sentences.push(
        `Workloads appear to execute within ${runtimeNames} container runtime environments.`,
      );
    }

    // Sentence 3: Integrations (Observability & Payments)
    if (integrationNodes.length > 0) {
      const analytics = integrationNodes.filter(
        (n) => n.category === 'Analytics / Observability',
      );
      const payments = integrationNodes.filter(
        (n) => n.category === 'Payments',
      );
      const others = integrationNodes.filter(
        (n) =>
          n.category !== 'Analytics / Observability' &&
          n.category !== 'Payments',
      );

      const integrationPhrases: string[] = [];
      if (analytics.length > 0) {
        integrationPhrases.push(
          `${analytics.map((n) => n.name).join(', ')} provides application observability`,
        );
      }
      if (payments.length > 0) {
        integrationPhrases.push(
          `${payments.map((n) => n.name).join(', ')} provides payment checkout integrations`,
        );
      }
      if (others.length > 0) {
        integrationPhrases.push(
          `${others.map((n) => n.name).join(', ')} provides external service integration`,
        );
      }

      if (integrationPhrases.length > 0) {
        sentences.push(`${integrationPhrases.join(', while ')}.`);
      }
    }

    // Sentence 4: Security Policy Enforcement
    if (securityNodes.length > 0) {
      const secNames = securityNodes.map((n) => n.name).join(', ');
      sentences.push(
        `${secNames} is enforced across all client communication paths.`,
      );
    }

    if (sentences.length === 0) {
      return `Observed ${topology.totalNodes} technologies active in the infrastructure path for ${context.domainName}.`;
    }

    return sentences.join(' ');
  }
}
