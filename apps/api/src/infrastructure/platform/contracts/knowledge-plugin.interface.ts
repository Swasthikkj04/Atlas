import { NormalizationResult } from '../../normalization/contracts/normalization-result.interface';
import { PluginManifest, PluginLifecycleState } from './plugin-manifest.interface';

export interface AtlasKnowledgePlugin {
  readonly manifest: PluginManifest;
  state: PluginLifecycleState;

  initialize(): Promise<void>;
  normalize(
    domainId: string,
    evidenceId: string,
    rawPayload: any,
  ): NormalizationResult<any>;
  shutdown(): Promise<void>;
}
