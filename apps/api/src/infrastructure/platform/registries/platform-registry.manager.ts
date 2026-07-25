import { Injectable } from '@nestjs/common';
import { DiscoveryRegistry } from './discovery.registry';
import { KnowledgeRegistry } from './knowledge.registry';
import { IntelligenceRegistry } from './intelligence.registry';

@Injectable()
export class PlatformRegistryManager {
  constructor(
    readonly discovery: DiscoveryRegistry,
    readonly knowledge: KnowledgeRegistry,
    readonly intelligence: IntelligenceRegistry,
  ) {}

  getAllManifests() {
    return {
      discovery: this.discovery.getAllPlugins().map((p) => p.manifest),
      knowledge: this.knowledge.getAllPlugins().map((p) => p.manifest),
      intelligence: this.intelligence.getAllPlugins().map((p) => p.manifest),
    };
  }
}
