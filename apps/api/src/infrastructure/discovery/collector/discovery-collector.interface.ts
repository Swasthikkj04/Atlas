export interface DiscoveryCollector<TResult> {
  readonly name: string;

  collect(domainName: string): Promise<TResult>;
}
