import { Injectable } from '@nestjs/common';
import { HttpDiscoveryService } from '../../discovery/http/http-discovery.service';
import { AtlasDiscoveryPlugin } from '../contracts/discovery-plugin.interface';
import {
  PluginLifecycleState,
  PluginManifest,
} from '../contracts/plugin-manifest.interface';

@Injectable()
export class HttpDiscoveryPlugin implements AtlasDiscoveryPlugin {
  readonly manifest: PluginManifest = {
    id: 'http',
    name: 'HTTP Discovery Plugin',
    version: '1.0.0',
    engine: 'discovery',
    apiVersion: 1,
    capabilities: ['headers', 'redirects', 'status', 'security-headers'],
  };

  state: PluginLifecycleState = 'REGISTERED';

  constructor(private readonly httpDiscoveryService: HttpDiscoveryService) {}

  async initialize(): Promise<void> {
    this.state = 'INITIALIZED';
  }

  async collectEvidence(target: string) {
    this.state = 'EXECUTING';
    const result = await this.httpDiscoveryService.collectEvidence(target);
    this.state = 'INITIALIZED';
    return result;
  }

  async shutdown(): Promise<void> {
    this.state = 'SHUTDOWN';
  }
}
