import { Injectable, Logger } from '@nestjs/common';
import { AtlasDiscoveryPlugin } from '../contracts/discovery-plugin.interface';

@Injectable()
export class DiscoveryRegistry {
  private readonly logger = new Logger(DiscoveryRegistry.name);
  private readonly plugins = new Map<string, AtlasDiscoveryPlugin>();

  register(plugin: AtlasDiscoveryPlugin): void {
    if (this.plugins.has(plugin.manifest.id)) {
      throw new Error(
        `Discovery plugin with ID '${plugin.manifest.id}' is already registered`,
      );
    }

    plugin.state = 'REGISTERED';
    this.plugins.set(plugin.manifest.id, plugin);
    this.logger.log(
      `Registered Discovery Plugin: ${plugin.manifest.name} (v${plugin.manifest.version})`,
    );
  }

  async initializePlugin(id: string): Promise<void> {
    const plugin = this.getPlugin(id);
    if (!plugin) {
      throw new Error(`Discovery plugin '${id}' not found`);
    }

    plugin.state = 'VALIDATED';
    await plugin.initialize();
    plugin.state = 'INITIALIZED';
  }

  getPlugin(id: string): AtlasDiscoveryPlugin | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): AtlasDiscoveryPlugin[] {
    return Array.from(this.plugins.values());
  }
}
