import { Injectable, Logger } from '@nestjs/common';
import { AtlasIntelligencePlugin } from '../contracts/intelligence-plugin.interface';

@Injectable()
export class IntelligenceRegistry {
  private readonly logger = new Logger(IntelligenceRegistry.name);
  private readonly plugins = new Map<string, AtlasIntelligencePlugin>();

  register(plugin: AtlasIntelligencePlugin): void {
    if (this.plugins.has(plugin.manifest.id)) {
      throw new Error(
        `Intelligence plugin with ID '${plugin.manifest.id}' is already registered`,
      );
    }

    plugin.state = 'REGISTERED';
    this.plugins.set(plugin.manifest.id, plugin);
    this.logger.log(
      `Registered Intelligence Plugin: ${plugin.manifest.name} (v${plugin.manifest.version})`,
    );
  }

  async initializePlugin(id: string): Promise<void> {
    const plugin = this.getPlugin(id);
    if (!plugin) {
      throw new Error(`Intelligence plugin '${id}' not found`);
    }

    plugin.state = 'VALIDATED';
    await plugin.initialize();
    plugin.state = 'INITIALIZED';
  }

  getPlugin(id: string): AtlasIntelligencePlugin | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): AtlasIntelligencePlugin[] {
    return Array.from(this.plugins.values());
  }
}
