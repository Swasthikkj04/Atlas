import { Injectable } from '@nestjs/common';
import { HttpNormalizerService } from '../../normalization/normalizers/http-normalizer.service';
import { AtlasKnowledgePlugin } from '../contracts/knowledge-plugin.interface';
import {
  PluginLifecycleState,
  PluginManifest,
} from '../contracts/plugin-manifest.interface';

@Injectable()
export class HttpKnowledgePlugin implements AtlasKnowledgePlugin {
  readonly manifest: PluginManifest = {
    id: 'http-knowledge',
    name: 'HTTP Knowledge Normalizer Plugin',
    version: '1.0.0',
    engine: 'knowledge',
    apiVersion: 1,
    capabilities: ['canonical-headers', 'case-normalization', 'header-merging'],
  };

  state: PluginLifecycleState = 'REGISTERED';

  constructor(private readonly httpNormalizer: HttpNormalizerService) {}

  async initialize(): Promise<void> {
    this.state = 'INITIALIZED';
  }

  normalize(domainId: string, evidenceId: string, rawPayload: any) {
    this.state = 'EXECUTING';
    const result = this.httpNormalizer.normalize(
      domainId,
      evidenceId,
      rawPayload,
    );
    this.state = 'INITIALIZED';
    return result;
  }

  async shutdown(): Promise<void> {
    this.state = 'SHUTDOWN';
  }
}
