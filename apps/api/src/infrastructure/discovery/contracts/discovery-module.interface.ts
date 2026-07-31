import type { DiscoveryModuleName } from './discovery-module-name.type';

export interface DiscoveryModule<TResult = unknown> {
  readonly name: DiscoveryModuleName;

  discover(domainName: string): Promise<TResult>;
}
