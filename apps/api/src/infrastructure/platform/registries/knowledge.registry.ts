import { Injectable, Logger } from '@nestjs/common';
import { AtlasKnowledgePlugin } from '../contracts/knowledge-plugin.interface';

@Injectable()
export class KnowledgeRegistry {
  private readonly logger = new Logger(KnowledgeRegistry.name);
  private readonly plugins = new Map<string, AtlasKnowledgePlugin>();

  register(plugin: AtlasKnowledgePlugin): void {
    if (this.plugins.has(plugin.manifest.id)) {
      throw new Error(
        `Knowledge plugin with ID '${plugin.manifest.id}' is already registered`,
      );
    }

    plugin.state = 'REGISTERED';
    this.plugins.set(plugin.manifest.id, plugin);
    this.logger.log(
      `Registered Knowledge Plugin: ${plugin.manifest.name} (v${plugin.manifest.version})`,
    );
  }

  async initializePlugin(id: string): Promise<void> {
    const plugin = this.getPlugin(id);
    if (!plugin) {
      throw new Error(`Knowledge plugin '${id}' not found`);
    }

    plugin.state = 'VALIDATED';
    await plugin.initialize();
    plugin.state = 'INITIALIZED';
  }

  getPlugin(id: string): AtlasKnowledgePlugin | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): AtlasKnowledgePlugin[] {
    return Array.from(this.plugins.values());
  }
}
