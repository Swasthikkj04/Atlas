import { Injectable, Logger } from '@nestjs/common';
import { TechnologyRelationshipRegistryService } from '../registry/technology-relationship-registry.service';
import {
  DetectedTechnology,
  TechnologyDetectionContext,
  TopologyNode,
  TopologyLayer,
  TechnologyRelationship,
  InfrastructureTopology,
  TechnologyCategory,
} from '../contracts';

@Injectable()
export class InfrastructureRelationshipEngine {
  private readonly logger = new Logger(InfrastructureRelationshipEngine.name);

  constructor(
    private readonly relationshipRegistry: TechnologyRelationshipRegistryService,
  ) {}

  async buildTopology(
    technologies: DetectedTechnology[],
    context: TechnologyDetectionContext,
  ): Promise<InfrastructureTopology> {
    // 1. Transform detected technologies into TopologyNodes
    const nodes = this.mapTechnologiesToNodes(technologies);

    // 2. Evaluate plug-and-play relationship rules from the registry
    const rawRelationships = await this.relationshipRegistry.evaluateAll(
      nodes,
      context,
    );

    // 3. Deduplicate relationships
    const uniqueMap = new Map<string, TechnologyRelationship>();
    for (const rel of rawRelationships) {
      const key = `${rel.sourceTechnologyId}:${rel.relationshipType}:${rel.targetTechnologyId}`;
      const existing = uniqueMap.get(key);
      if (!existing || rel.confidence > existing.confidence) {
        uniqueMap.set(key, rel);
      }
    }

    const relationships = Array.from(uniqueMap.values());

    // 4. Group nodes by topology layer
    const layers: Record<TopologyLayer, TopologyNode[]> = {
      [TopologyLayer.EDGE]: [],
      [TopologyLayer.GATEWAY]: [],
      [TopologyLayer.APPLICATION]: [],
      [TopologyLayer.RUNTIME]: [],
      [TopologyLayer.INTEGRATION]: [],
      [TopologyLayer.SECURITY]: [],
      [TopologyLayer.PLATFORM]: [],
    };

    for (const node of nodes) {
      layers[node.layer].push(node);
    }

    // 5. Calculate relationship state statistics
    let confirmedCount = 0;
    let supportedCount = 0;
    let inferredCount = 0;

    for (const rel of relationships) {
      if (rel.evidenceState === 'CONFIRMED') confirmedCount++;
      else if (rel.evidenceState === 'SUPPORTED') supportedCount++;
      else if (rel.evidenceState === 'INFERRED') inferredCount++;
    }

    // 6. Generate human-readable topology summary
    const summary = this.generateTopologySummary(nodes, relationships, context);

    this.logger.debug(
      `Built topology for ${context.domainName}: ${nodes.length} nodes, ${relationships.length} relationships (${confirmedCount} confirmed, ${supportedCount} supported, ${inferredCount} inferred)`,
    );

    return {
      nodes,
      relationships,
      layers,
      summary,
      totalNodes: nodes.length,
      totalRelationships: relationships.length,
      confirmedRelationshipsCount: confirmedCount,
      supportedRelationshipsCount: supportedCount,
      inferredRelationshipsCount: inferredCount,
      generatedAt: new Date().toISOString(),
    };
  }

  private mapTechnologiesToNodes(
    technologies: DetectedTechnology[],
  ): TopologyNode[] {
    return technologies.map((tech) => {
      const layer = this.assignTopologyLayer(tech);

      return {
        id: tech.id,
        technologyId: tech.id,
        name: tech.name,
        category: tech.category,
        layer,
        role: tech.role,
        infrastructureMeaning: tech.infrastructureMeaning,
        whyDetected: tech.whyDetected,
        confidence: tech.confidence,
        confidenceLevel: tech.confidenceLevel,
        version: tech.version,
        evidenceCount: tech.evidenceCount,
        whatThisDoesNotProve: tech.whatThisDoesNotProve,
        implications: tech.implications,
      };
    });
  }

  private assignTopologyLayer(tech: DetectedTechnology): TopologyLayer {
    const category =
      typeof tech.category === 'string'
        ? tech.category.toLowerCase()
        : String(tech.category).toLowerCase();
    const id = tech.id.toLowerCase();

    // Edge CDN / Cloud WAF
    if (
      category.includes('cdn') ||
      category.includes('edge') ||
      id.includes('cloudflare') ||
      id.includes('cloudfront') ||
      id.includes('akamai') ||
      id.includes('fastly')
    ) {
      return TopologyLayer.EDGE;
    }

    // Managed Platforms / CMS
    if (
      category.includes('cms') ||
      id.includes('shopify') ||
      id.includes('webflow') ||
      id.includes('wix') ||
      id.includes('vercel') ||
      id.includes('netlify') ||
      id.includes('github-pages')
    ) {
      return TopologyLayer.PLATFORM;
    }

    // Web Server / Reverse Proxy Gateway
    if (
      category.includes('server') ||
      category.includes('gateway') ||
      id.includes('nginx') ||
      id.includes('apache') ||
      id.includes('caddy') ||
      id.includes('traefik') ||
      id.includes('envoy') ||
      id.includes('haproxy') ||
      id.includes('iis') ||
      id.includes('litespeed')
    ) {
      return TopologyLayer.GATEWAY;
    }

    // Application Frameworks
    if (
      category.includes('framework') ||
      id.includes('nextjs') ||
      id.includes('react') ||
      id.includes('vue') ||
      id.includes('angular') ||
      id.includes('svelte') ||
      id.includes('laravel') ||
      id.includes('django') ||
      id.includes('rails')
    ) {
      return TopologyLayer.APPLICATION;
    }

    // Runtime / Containerization
    if (
      category.includes('runtime') ||
      id.includes('docker') ||
      id.includes('kubernetes') ||
      id.includes('java-enterprise')
    ) {
      return TopologyLayer.RUNTIME;
    }

    // Analytics / Observability & Payments (Integrations)
    if (
      category.includes('analytics') ||
      category.includes('payment') ||
      id.includes('sentry') ||
      id.includes('datadog') ||
      id.includes('new-relic') ||
      id.includes('stripe') ||
      id.includes('paypal') ||
      id.includes('google-analytics') ||
      id.includes('posthog')
    ) {
      return TopologyLayer.INTEGRATION;
    }

    // Security / Policy
    if (category.includes('security') || id.includes('hsts')) {
      return TopologyLayer.SECURITY;
    }

    // Cloud Infrastructure / Hosting Providers
    if (
      category.includes('cloud') ||
      category.includes('infrastructure') ||
      id.includes('aws') ||
      id.includes('gcp') ||
      id.includes('azure') ||
      id.includes('flyio') ||
      id.includes('render') ||
      id.includes('railway')
    ) {
      return TopologyLayer.PLATFORM;
    }

    return TopologyLayer.APPLICATION;
  }

  private generateTopologySummary(
    nodes: TopologyNode[],
    relationships: TechnologyRelationship[],
    context: TechnologyDetectionContext,
  ): string {
    if (nodes.length === 0) {
      return `No public application or infrastructure technologies detected for ${context.domainName}.`;
    }

    const edgeNodes = nodes.filter((n) => n.layer === TopologyLayer.EDGE);
    const gatewayNodes = nodes.filter((n) => n.layer === TopologyLayer.GATEWAY);
    const appNodes = nodes.filter((n) => n.layer === TopologyLayer.APPLICATION);
    const platformNodes = nodes.filter(
      (n) => n.layer === TopologyLayer.PLATFORM,
    );
    const integrationNodes = nodes.filter(
      (n) => n.layer === TopologyLayer.INTEGRATION,
    );

    const parts: string[] = [];

    if (edgeNodes.length > 0) {
      const edgeNames = edgeNodes.map((n) => n.name).join(', ');
      parts.push(`fronted by ${edgeNames} (Edge / CDN)`);
    }

    if (platformNodes.length > 0) {
      const platformNames = platformNodes.map((n) => n.name).join(', ');
      parts.push(`hosted on ${platformNames} platform`);
    }

    if (gatewayNodes.length > 0) {
      const gatewayNames = gatewayNodes.map((n) => n.name).join(', ');
      parts.push(`routed through ${gatewayNames} (Gateway)`);
    }

    if (appNodes.length > 0) {
      const appNames = appNodes.map((n) => n.name).join(', ');
      parts.push(`executing ${appNames} application runtime`);
    }

    if (integrationNodes.length > 0) {
      const integrationNames = integrationNodes.map((n) => n.name).join(', ');
      parts.push(`integrating with ${integrationNames}`);
    }

    if (parts.length === 0) {
      return `Observed ${nodes.length} infrastructure components active for ${context.domainName}.`;
    }

    return `Infrastructure for ${context.domainName} is ${parts.join(', ')}.`;
  }
}
