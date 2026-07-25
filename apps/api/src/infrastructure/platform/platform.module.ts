import { Module, OnModuleInit } from '@nestjs/common';

import { DiscoveryModule } from '../discovery/discovery.module';
import { NormalizationModule } from '../normalization/normalization.module';

import { HttpDiscoveryPlugin } from './plugins/http-discovery.plugin';
import { HttpIntelligencePlugin } from './plugins/http-intelligence.plugin';
import { HttpKnowledgePlugin } from './plugins/http-knowledge.plugin';

import { DiscoveryRegistry } from './registries/discovery.registry';
import { IntelligenceRegistry } from './registries/intelligence.registry';
import { KnowledgeRegistry } from './registries/knowledge.registry';
import { PlatformRegistryManager } from './registries/platform-registry.manager';

@Module({
  imports: [DiscoveryModule, NormalizationModule],
  providers: [
    DiscoveryRegistry,
    KnowledgeRegistry,
    IntelligenceRegistry,
    PlatformRegistryManager,
    HttpDiscoveryPlugin,
    HttpKnowledgePlugin,
    HttpIntelligencePlugin,
  ],
  exports: [
    DiscoveryRegistry,
    KnowledgeRegistry,
    IntelligenceRegistry,
    PlatformRegistryManager,
    HttpDiscoveryPlugin,
    HttpKnowledgePlugin,
    HttpIntelligencePlugin,
  ],
})
export class PlatformModule implements OnModuleInit {
  constructor(
    private readonly discoveryRegistry: DiscoveryRegistry,
    private readonly knowledgeRegistry: KnowledgeRegistry,
    private readonly intelligenceRegistry: IntelligenceRegistry,
    private readonly httpDiscoveryPlugin: HttpDiscoveryPlugin,
    private readonly httpKnowledgePlugin: HttpKnowledgePlugin,
    private readonly httpIntelligencePlugin: HttpIntelligencePlugin,
  ) {}

  async onModuleInit() {
    this.discoveryRegistry.register(this.httpDiscoveryPlugin);
    await this.discoveryRegistry.initializePlugin('http');

    this.knowledgeRegistry.register(this.httpKnowledgePlugin);
    await this.knowledgeRegistry.initializePlugin('http-knowledge');

    this.intelligenceRegistry.register(this.httpIntelligencePlugin);
    await this.intelligenceRegistry.initializePlugin('http-intelligence');
  }
}
