import {
  PluginManifest,
  PluginLifecycleState,
} from './plugin-manifest.interface';

export interface AtlasExperiencePlugin {
  readonly manifest: PluginManifest;
  state: PluginLifecycleState;

  initialize(): Promise<void>;
  renderExperienceData(domainId: string, context?: any): Promise<any>;
  shutdown(): Promise<void>;
}
