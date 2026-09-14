import { Injectable } from '@nestjs/common';
import {
  NormalizedSpfObservation,
  NormalizedDmarcObservation,
  NormalizedDanglingCnameObservation,
  DnsSecurityPostureAssessment,
  DmarcPolicyLevel,
  SpfQualifier,
} from '../contracts/dns-security.interface';

export const KNOWN_TAKEOVER_PATTERNS: Array<{
  pattern: RegExp;
  provider: string;
  serviceType: string;
}> = [
  {
    pattern: /\.github\.io$/i,
    provider: 'GitHub Pages',
    serviceType: 'Static Hosting',
  },
  {
    pattern: /\.s3(-website)?([.-][a-z0-9-]+)?\.amazonaws\.com$/i,
    provider: 'AWS S3',
    serviceType: 'Cloud Storage',
  },
  {
    pattern: /\.herokuapp\.com$/i,
    provider: 'Heroku',
    serviceType: 'PaaS Hosting',
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
  },
  {
    pattern: /\.cloudapp\.net$/i,
    provider: 'Azure VM / Cloud Services',
    serviceType: 'Cloud VM',
  },
  {
    pattern: /\.trafficmanager\.net$/i,
    provider: 'Azure Traffic Manager',
    serviceType: 'Traffic Routing',
  },
  { pattern: /\.azureedge\.net$/i, provider: 'Azure CDN', serviceType: 'CDN' },
  {
    pattern: /\.blob\.core\.windows\.net$/i,
    provider: 'Azure Blob Storage',
    serviceType: 'Cloud Storage',
  },
  {
    pattern: /\.surge\.sh$/i,
    provider: 'Surge.sh',
    serviceType: 'Static Hosting',
  },
  {
    pattern: /\.readme\.io$/i,
    provider: 'Readme.io',
    serviceType: 'Documentation Hosting',
  },
  {
    pattern: /\.ghost\.io$/i,
    provider: 'Ghost CMS',
    serviceType: 'Managed Blog',
  },
  {
    pattern: /\.myshopify\.com$/i,
    provider: 'Shopify',
    serviceType: 'E-commerce',
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
  },
  {
    pattern: /\.vercel-dns\.com$/i,
    provider: 'Vercel',
    serviceType: 'Edge Hosting',
  },
];

@Injectable()
export class DnsSecurityAnalyzerService {
  /**
   * Parse SPF TXT record and evaluate qualifier quality.
   */
  analyzeSpf(
    txtRecords: Array<string | string[]> = [],
  ): NormalizedSpfObservation {
    const flattened = txtRecords.map((r) =>
      Array.isArray(r) ? r.join('') : String(r),
    );
    const spfRecord = flattened.find((r) =>
      r.trim().toLowerCase().startsWith('v=spf1'),
    );

    if (!spfRecord) {
      return {
        present: false,
        isPermissive: false,
        includeCount: 0,
        mechanisms: [],
      };
    }

    const tokens = spfRecord.trim().split(/\s+/).filter(Boolean);
    const mechanisms = tokens.slice(1);
    let qualifier: SpfQualifier = 'CUSTOM';
    let isPermissive = false;
    let includeCount = 0;

    for (const mech of mechanisms) {
      const lower = mech.toLowerCase();
      if (lower.startsWith('include:')) {
        includeCount++;
      }
      if (lower === '+all' || lower === 'all') {
        qualifier = 'PASS_ALL';
        isPermissive = true;
      } else if (lower === '?all') {
        qualifier = 'NEUTRAL_ALL';
        isPermissive = true;
      } else if (lower === '~all') {
        qualifier = 'SOFTFAIL_ALL';
      } else if (lower === '-all') {
        qualifier = 'HARDFFAIL_ALL';
      }
    }

    return {
      present: true,
      rawRecord: spfRecord,
      qualifier,
      isPermissive,
      includeCount,
      mechanisms,
    };
  }

  /**
   * Parse DMARC TXT record and evaluate enforcement tier.
   */
  analyzeDmarc(
    dmarcRecords: Array<string | string[]> = [],
  ): NormalizedDmarcObservation {
    const flattened = dmarcRecords.map((r) =>
      Array.isArray(r) ? r.join('') : String(r),
    );
    const dmarcRecord = flattened.find((r) =>
      r.trim().toLowerCase().startsWith('v=dmarc1'),
    );

    if (!dmarcRecord) {
      return {
        present: false,
        policy: 'UNKNOWN',
        isEnforced: false,
        isMonitoringOnly: false,
      };
    }

    let policy: DmarcPolicyLevel = 'UNKNOWN';
    let subdomainPolicy: DmarcPolicyLevel | undefined;
    let percentage: number | undefined;
    let ruaDestination: string | undefined;

    const tags = dmarcRecord
      .split(';')
      .map((t) => t.trim())
      .filter(Boolean);
    for (const tag of tags) {
      const [key, ...rest] = tag.split('=');
      const k = key?.trim().toLowerCase();
      const v = rest.join('=').trim().toLowerCase();

      if (k === 'p') {
        if (v === 'reject') policy = 'REJECT';
        else if (v === 'quarantine') policy = 'QUARANTINE';
        else if (v === 'none') policy = 'NONE';
      } else if (k === 'sp') {
        if (v === 'reject') subdomainPolicy = 'REJECT';
        else if (v === 'quarantine') subdomainPolicy = 'QUARANTINE';
        else if (v === 'none') subdomainPolicy = 'NONE';
      } else if (k === 'pct') {
        const parsed = parseInt(v, 10);
        if (!isNaN(parsed)) percentage = parsed;
      } else if (k === 'rua') {
        ruaDestination = rest.join('=').trim();
      }
    }

    const isEnforced = policy === 'REJECT' || policy === 'QUARANTINE';
    const isMonitoringOnly = policy === 'NONE';

    return {
      present: true,
      rawRecord: dmarcRecord,
      policy,
      subdomainPolicy,
      percentage,
      ruaDestination,
      isEnforced,
      isMonitoringOnly,
    };
  }

  /**
   * Detect potential dangling CNAME pointers to vulnerable cloud services.
   */
  analyzeDanglingCname(
    cnameRecords: string[] = [],
    aRecords: string[] = [],
    httpReachable = true,
  ): NormalizedDanglingCnameObservation {
    if (!cnameRecords || cnameRecords.length === 0) {
      return {
        hasCname: false,
        isPotentiallyDangling: false,
      };
    }

    const primaryCname = cnameRecords[0].trim();
    for (const item of KNOWN_TAKEOVER_PATTERNS) {
      if (item.pattern.test(primaryCname)) {
        // If CNAME points to cloud provider and A records are empty or HTTP is unreachable, surface dangling exposure
        const isDangling = aRecords.length === 0 || !httpReachable;
        return {
          hasCname: true,
          cnameTarget: primaryCname,
          matchedProvider: item.provider,
          targetServiceType: item.serviceType,
          isPotentiallyDangling: isDangling,
        };
      }
    }

    return {
      hasCname: true,
      cnameTarget: primaryCname,
      isPotentiallyDangling: false,
    };
  }

  /**
   * Assess holistic DNS and mail security posture.
   */
  assessDnsSecurityPosture(
    domain: string,
    dnsData: any,
    httpReachable = true,
    snapshotId?: string,
  ): DnsSecurityPostureAssessment {
    const spf = this.analyzeSpf(dnsData?.txt || []);
    const dmarc = this.analyzeDmarc(dnsData?.dmarc || []);
    const danglingCname = this.analyzeDanglingCname(
      dnsData?.cname || [],
      dnsData?.a || [],
      httpReachable,
    );

    let score = 100;

    if (!spf.present) {
      score -= 30;
    } else if (spf.isPermissive) {
      score -= 20;
    }

    if (!dmarc.present) {
      score -= 30;
    } else if (dmarc.isMonitoringOnly) {
      score -= 15;
    }

    if (danglingCname.isPotentiallyDangling) {
      score -= 40;
    }

    score = Math.max(0, Math.min(100, score));
    const isCompliant = score >= 75 && !danglingCname.isPotentiallyDangling;

    const summary = isCompliant
      ? `Strong DNS & Mail authentication posture on ${domain} (SPF & DMARC enforced, no dangling pointers)`
      : `DNS & Mail security posture on ${domain} has hardening gaps (score: ${score}/100)`;

    return {
      domain,
      snapshotId,
      spf,
      dmarc,
      danglingCname,
      overallScore: score,
      isCompliant,
      summary,
    };
  }
}
