export type PluginEngineType =
  'discovery' | 'knowledge' | 'intelligence' | 'experience';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  engine: PluginEngineType;
  apiVersion: number;
  minAtlasVersion?: string;
  maxAtlasVersion?: string;
  capabilities: string[];
}

export type PluginLifecycleState =
  'REGISTERED' | 'VALIDATED' | 'INITIALIZED' | 'EXECUTING' | 'SHUTDOWN';
