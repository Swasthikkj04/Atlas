import { Injectable } from '@nestjs/common';
import {
  EnvironmentClassification,
  SubdomainTakeoverRisk,
} from '../contracts/subdomain-discovery.interface';

export interface TakeoverEvaluationResult {
  readonly risk: SubdomainTakeoverRisk;
  readonly matchedProvider?: string;
  readonly matchedCname?: string;
  readonly reason?: string;
  readonly remediation?: string;
}

export const CLOUD_TAKEOVER_SIGNATURES: Array<{
  pattern: RegExp;
  provider: string;
  serviceType: string;
  unclaimedFingerprints?: string[];
}> = [
  {
    pattern: /\.s3(-website)?([.-][a-z0-9-]+)?\.amazonaws\.com$/i,
    provider: 'AWS S3',
    serviceType: 'Cloud Storage',
    unclaimedFingerprints: [
      'NoSuchBucket',
      'The specified bucket does not exist',
    ],
  },
  {
    pattern: /\.github\.io$/i,
    provider: 'GitHub Pages',
    serviceType: 'Static Hosting',
    unclaimedFingerprints: [
      "There isn't a GitHub Pages site here",
      "404 There isn't a GitHub Pages site here",
    ],
  },
  {
    pattern: /\.herokuapp\.com$/i,
    provider: 'Heroku',
    serviceType: 'PaaS Hosting',
    unclaimedFingerprints: ['No such app', 'Heroku | No such app'],
  },
  {
    pattern: /\.herokudns\.com$/i,
    provider: 'Heroku DNS',
    serviceType: 'PaaS Routing',
  },
  {
    pattern: /\.azurewebsites\.net$/i,
    provider: 'Azure App Service',
    serviceType: 'Cloud App',
    unclaimedFingerprints: ['404 Web Site not found'],
  },
  {
    pattern: /\.cloudapp\.net$/i,
    provider: 'Azure Cloud Services',
    serviceType: 'Cloud VM',
  },
  {
    pattern: /\.trafficmanager\.net$/i,
    provider: 'Azure Traffic Manager',
    serviceType: 'Traffic Routing',
  },
  {
    pattern: /\.azureedge\.net$/i,
    provider: 'Azure CDN',
    serviceType: 'CDN',
  },
  {
    pattern: /\.blob\.core\.windows\.net$/i,
    provider: 'Azure Blob Storage',
    serviceType: 'Cloud Storage',
  },
  {
    pattern: /\.surge\.sh$/i,
    provider: 'Surge.sh',
    serviceType: 'Static Hosting',
    unclaimedFingerprints: ['project not found'],
  },
  {
    pattern: /\.readme\.io$/i,
    provider: 'Readme.io',
    serviceType: 'Documentation Hosting',
    unclaimedFingerprints: ['Project doesnt exist'],
  },
  {
    pattern: /\.ghost\.io$/i,
    provider: 'Ghost CMS',
    serviceType: 'Managed Blog',
    unclaimedFingerprints: ['The thing you were looking for is no longer here'],
  },
  {
    pattern: /\.myshopify\.com$/i,
    provider: 'Shopify',
    serviceType: 'E-commerce',
    unclaimedFingerprints: ['Sorry, this shop is currently unavailable'],
  },
  {
    pattern: /\.fly\.dev$/i,
    provider: 'Fly.io',
    serviceType: 'Serverless App',
  },
  {
    pattern: /\.netlify\.app$/i,
    provider: 'Netlify',
    serviceType: 'Jamstack Hosting',
    unclaimedFingerprints: ['Not Found - Request ID:'],
  },
  {
    pattern: /\.vercel-dns\.com$/i,
    provider: 'Vercel',
    serviceType: 'Edge Hosting',
  },
  {
    pattern: /\.zendesk\.com$/i,
    provider: 'Zendesk',
    serviceType: 'Customer Support Portal',
    unclaimedFingerprints: ['Help Center Closed'],
  },
  {
    pattern: /\.fastly\.net$/i,
    provider: 'Fastly',
    serviceType: 'CDN Edge',
    unclaimedFingerprints: ['Fastly error: unknown domain'],
  },
];

@Injectable()
export class SubdomainTakeoverAnalyzerService {
  /**
   * Evaluates takeover risk for a subdomain based on CNAME, IP records, and HTTP reachability.
   */
  evaluateTakeoverRisk(params: {
    hostname: string;
    cnameTargets: string[];
    ipAddresses: string[];
    httpStatus?: number;
    httpResponseBody?: string;
  }): TakeoverEvaluationResult {
    const { cnameTargets, ipAddresses, httpResponseBody } = params;

    if (!cnameTargets || cnameTargets.length === 0) {
      return { risk: 'NONE' };
    }

    for (const cname of cnameTargets) {
      const normalizedCname = cname.toLowerCase().replace(/\.$/, '');

      for (const entry of CLOUD_TAKEOVER_SIGNATURES) {
        if (entry.pattern.test(normalizedCname)) {
          // Check if unclaimed fingerprint matches in response body
          if (httpResponseBody && entry.unclaimedFingerprints) {
            for (const fp of entry.unclaimedFingerprints) {
              if (httpResponseBody.includes(fp)) {
                return {
                  risk: 'CRITICAL',
                  matchedProvider: entry.provider,
                  matchedCname: normalizedCname,
                  reason: `Confirmed unclaimed ${entry.provider} resource (${entry.serviceType}). Fingerprint '${fp}' detected in response body.`,
                  remediation: `Immediately claim this resource in your ${entry.provider} account or remove the CNAME record from DNS.`,
                };
              }
            }
          }

          // If CNAME points to cloud provider and no active A records resolve
          if (!ipAddresses || ipAddresses.length === 0) {
            return {
              risk: 'HIGH',
              matchedProvider: entry.provider,
              matchedCname: normalizedCname,
              reason: `Dangling CNAME to ${entry.provider} (${entry.serviceType}) with no active IP resolutions.`,
              remediation: `Verify if this ${entry.provider} asset is actively provisioned. Remove the CNAME record if deprecated.`,
            };
          }

          // CNAME resolved to cloud provider and active IPs exist
          return {
            risk: 'LOW',
            matchedProvider: entry.provider,
            matchedCname: normalizedCname,
            reason: `Active CNAME routing via ${entry.provider} (${entry.serviceType}).`,
          };
        }
      }
    }

    // Check for generic dangling CNAME (points to something unresolvable)
    if ((!ipAddresses || ipAddresses.length === 0) && cnameTargets.length > 0) {
      return {
        risk: 'MEDIUM',
        matchedCname: cnameTargets[0],
        reason: `Dangling CNAME record pointing to unresolvable destination '${cnameTargets[0]}'.`,
        remediation:
          'Remove the orphaned CNAME record from your authoritative DNS zone.',
      };
    }

    return { risk: 'NONE' };
  }

  /**
   * Classifies the environment based on subdomain naming patterns.
   */
  classifyEnvironment(prefix: string): EnvironmentClassification {
    const p = prefix.toLowerCase();

    if (
      /^(dev|development|sandbox|local|poc)$/.test(p) ||
      /-(dev|sandbox)$/.test(p)
    ) {
      return 'DEVELOPMENT';
    }

    if (
      /^(staging|stage|qa|uat|test|testing|preview|preprod|demo|canary)$/.test(
        p,
      ) ||
      /-(stage|staging|qa|uat|test|demo)$/.test(p)
    ) {
      return 'STAGING';
    }

    if (
      /^(internal|corp|vpn|intra|private|admin|staff|backend|mgmt|management|portal-admin|grafana|k8s|vault)$/.test(
        p,
      ) ||
      /-(internal|corp|vpn|admin)$/.test(p)
    ) {
      return 'INTERNAL';
    }

    if (/^(old|legacy|deprecated|v1-old|backup|archive|bak)$/.test(p)) {
      return 'DEPRECATED';
    }

    if (
      /^(www|api|app|auth|login|cdn|static|assets|mail|email|status|docs|help|gateway|ingress|ws|grpc|beta|mobile)$/.test(
        p,
      )
    ) {
      return 'PRODUCTION';
    }

    return 'UNKNOWN';
  }
}
