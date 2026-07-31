import { CollectorExecutionResult } from '../../discovery/contracts/evidence/collector-execution-result.interface';
import {
  PluginManifest,
  PluginLifecycleState,
} from './plugin-manifest.interface';

export interface AtlasDiscoveryPlugin {
  readonly manifest: PluginManifest;
  state: PluginLifecycleState;

  initialize(): Promise<void>;
  collectEvidence(target: string): Promise<CollectorExecutionResult<any>>;
  shutdown(): Promise<void>;
}
