import { Injectable, Logger } from '@nestjs/common';
import { promises as dns } from 'node:dns';
import * as crypto from 'node:crypto';
import {
  DiscoveredSubdomain,
  EnvironmentClassification,
  SubdomainPerimeterReport,
  SubdomainSource,
  SubdomainTakeoverRisk,
} from './contracts/subdomain-discovery.interface';
import { SubdomainTakeoverAnalyzerService } from './services/subdomain-takeover-analyzer.service';
import { isPrivateOrRestrictedIp } from '../../../common/security/ssrf-guard';

export const HIGH_VALUE_SUBDOMAIN_WORDLIST: string[] = [
  'www',
  'api',
  'app',
  'auth',
  'admin',
  'dev',
  'staging',
  'stage',
  'test',
  'cdn',
  'portal',
  'vpn',
  'corp',
  'internal',
  'mail',
  'status',
  'docs',
  'git',
  'monitoring',
  'grafana',
  'k8s',
  'ingress',
  'gateway',
  'ws',
  'grpc',
  'beta',
  'sandbox',
  'demo',
  'assets',
  'static',
  'secure',
  'login',
  'dashboard',
  'preview',
  'qa',
  'uat',
  'support',
  'help',
  'billing',
  'vault',
];

@Injectable()
export class SubdomainDiscoveryService {
  private readonly logger = new Logger(SubdomainDiscoveryService.name);

  constructor(
    private readonly takeoverAnalyzer: SubdomainTakeoverAnalyzerService,
  ) {}

  /**
   * Performs high-speed multi-source subdomain discovery & perimeter expansion.
   */
  async discoverSubdomains(
    domain: string,
    options?: {
      extraWordlist?: string[];
      sanHostnames?: string[];
      concurrency?: number;
    },
  ): Promise<SubdomainPerimeterReport> {
    const startTime = Date.now();
    const cleanDomain = domain
      .toLowerCase()
      .trim()
      .replace(/^\.+|\.+$/g, '');

    // Step 1: Wildcard DNS Probing
    const wildcardIps = await this.detectWildcardDns(cleanDomain);
    const wildcardDetected = wildcardIps.length > 0;

    // Step 2: Build candidate set (Wordlist + SANs + Extra)
    const candidateMap = new Map<string, SubdomainSource>();

    // Add high-value wordlist
    const wordlist = Array.from(
      new Set([
        ...HIGH_VALUE_SUBDOMAIN_WORDLIST,
        ...(options?.extraWordlist || []),
      ]),
    );
    for (const prefix of wordlist) {
      const hostname = `${prefix}.${cleanDomain}`;
      candidateMap.set(hostname, 'DNS_BRUTEFORCE');
    }

    // Add TLS SAN hostnames if provided
    if (options?.sanHostnames && options.sanHostnames.length > 0) {
      for (const san of options.sanHostnames) {
        const cleanSan = san.toLowerCase().trim().replace(/^\*\./, '');
        if (cleanSan.endsWith(`.${cleanDomain}`) && cleanSan !== cleanDomain) {
          candidateMap.set(cleanSan, 'TLS_SAN');
        }
      }
    }

    // Step 3: Concurrent Resolution with Concurrency Limit
    const candidates = Array.from(candidateMap.entries());
    const concurrency = options?.concurrency || 10;
    const discovered: DiscoveredSubdomain[] = [];

    for (let i = 0; i < candidates.length; i += concurrency) {
      const batch = candidates.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(([hostname, source]) =>
          this.resolveCandidate(hostname, cleanDomain, source, wildcardIps),
        ),
      );

      for (const res of batchResults) {
        if (res) {
          discovered.push(res);
        }
      }
    }

    // Step 4: Aggregate summaries
    const environmentsSummary: Record<EnvironmentClassification, number> = {
      PRODUCTION: 0,
      STAGING: 0,
      DEVELOPMENT: 0,
      INTERNAL: 0,
      DEPRECATED: 0,
      UNKNOWN: 0,
    };

    const takeoverRisksSummary: Record<SubdomainTakeoverRisk, number> = {
      NONE: 0,
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    for (const sub of discovered) {
      environmentsSummary[sub.environmentType] =
        (environmentsSummary[sub.environmentType] || 0) + 1;
      takeoverRisksSummary[sub.takeoverRisk] =
        (takeoverRisksSummary[sub.takeoverRisk] || 0) + 1;
    }

    const durationMs = Date.now() - startTime;

    this.logger.debug(
      `Discovered ${discovered.length} subdomains for ${cleanDomain} in ${durationMs}ms (wildcard=${wildcardDetected})`,
    );

    return {
      domain: cleanDomain,
      totalDiscovered: discovered.length,
      subdomains: discovered,
      wildcardDetected,
      wildcardIps,
      environmentsSummary,
      takeoverRisksSummary,
      executionDurationMs: durationMs,
      scannedAt: new Date().toISOString(),
    };
  }

  /**
   * Tests for DNS wildcard by querying a non-existent randomized subdomain.
   */
  async detectWildcardDns(domain: string): Promise<string[]> {
    const randomPrefix = `atlas-wc-${crypto.randomBytes(4).toString('hex')}`;
    const testHost = `${randomPrefix}.${domain}`;

    try {
      const ips = await dns.resolve4(testHost);
      if (ips && ips.length > 0) {
        this.logger.warn(
          `Wildcard DNS detected on ${domain}: resolves to [${ips.join(', ')}]`,
        );
        return ips;
      }
    } catch {
      // Non-wildcard domain correctly NXDOMAINs
    }

    return [];
  }

  /**
   * Resolves DNS records and evaluates posture for a specific subdomain candidate.
   */
  private async resolveCandidate(
    hostname: string,
    apexDomain: string,
    source: SubdomainSource,
    wildcardIps: string[],
  ): Promise<DiscoveredSubdomain | null> {
    const prefix = hostname.replace(`.${apexDomain}`, '');
    let ipAddresses: string[] = [];
    let ipv6Addresses: string[] = [];
    let cnameTargets: string[] = [];

    // Resolve A
    try {
      ipAddresses = await dns.resolve4(hostname);
    } catch {
      // NXDOMAIN or NODATA
    }

    // Resolve AAAA
    try {
      ipv6Addresses = await dns.resolve6(hostname);
    } catch {
      // NXDOMAIN or NODATA
    }

    // Resolve CNAME
    try {
      cnameTargets = await dns.resolveCname(hostname);
    } catch {
      // No CNAME
    }

    // If nothing resolved at all, candidate doesn't exist
    if (
      ipAddresses.length === 0 &&
      ipv6Addresses.length === 0 &&
      cnameTargets.length === 0
    ) {
      return null;
    }

    // Filter SSRF / private IPs
    const publicIps = ipAddresses.filter((ip) => !isPrivateOrRestrictedIp(ip));
    const publicIpv6 = ipv6Addresses.filter(
      (ip) => !isPrivateOrRestrictedIp(ip),
    );

    // Check if result matches wildcard IPs exactly
    const isWildcardMatch =
      wildcardIps.length > 0 &&
      publicIps.length > 0 &&
      publicIps.every((ip) => wildcardIps.includes(ip));

    // Takeover Analysis
    const takeover = this.takeoverAnalyzer.evaluateTakeoverRisk({
      hostname,
      cnameTargets,
      ipAddresses: publicIps,
    });

    // Environment Classification
    const environmentType = this.takeoverAnalyzer.classifyEnvironment(prefix);

    return {
      hostname,
      subdomainPrefix: prefix,
      ipAddresses: publicIps,
      ipv6Addresses: publicIpv6,
      cnameTargets,
      tlsActive: publicIps.length > 0,
      isWildcard: isWildcardMatch,
      takeoverRisk: takeover.risk,
      takeoverProvider: takeover.matchedProvider,
      takeoverReason: takeover.reason,
      environmentType,
      discoveredVia: source,
      discoveredAt: new Date().toISOString(),
    };
  }
}
