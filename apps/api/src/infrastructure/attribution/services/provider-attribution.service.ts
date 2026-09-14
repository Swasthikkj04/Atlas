import { Injectable } from '@nestjs/common';
import type { DiscoverySnapshot } from '../../discovery/contracts/discovery-snapshot.interface';
import type {
  InfrastructureAttributionMap,
  ProviderAttributionRecord,
  AttributionSignal,
  CandidateProvider,
  ProviderConflict,
} from '../contracts/provider-attribution.interface';

@Injectable()
export class ProviderAttributionService {
  /**
   * Evaluates multi-signal infrastructure attribution across DNS, HTTP, TLS, Network, and Technology.
   * Enforces: Hosting != Edge != DNS.
   */
  attributeInfrastructure(
    snapshot: DiscoverySnapshot,
  ): InfrastructureAttributionMap {
    const dnsAttribution = this.attributeDnsProvider(snapshot);
    const edgeAttribution = this.attributeEdgeCdn(snapshot);
    const hostingAttribution = this.attributeHosting(snapshot, edgeAttribution);
    const webServerAttribution = this.attributeWebServer(snapshot);
    const appAttribution = this.attributeApplication(snapshot);

    return {
      hosting: hostingAttribution,
      edgeCdn: edgeAttribution,
      dns: dnsAttribution,
      webServer: webServerAttribution,
      application: appAttribution,
    };
  }

  private attributeHosting(
    snapshot: DiscoverySnapshot,
    edgeAttribution: ProviderAttributionRecord,
  ): ProviderAttributionRecord {
    const signals: AttributionSignal[] = [];
    const candidates: Map<string, { score: number; signals: string[] }> =
      new Map();

    const addScore = (provider: string, points: number, signalDesc: string) => {
      const current = candidates.get(provider) || { score: 0, signals: [] };
      current.score += points;
      current.signals.push(signalDesc);
      candidates.set(provider, current);
    };

    const headers = snapshot.http?.headers || {};
    const cnames = (snapshot.dns?.cname || []).map((c) =>
      String(c).toLowerCase(),
    );
    const nsRecords = (snapshot.dns?.ns || []).map((n) =>
      String(n).toLowerCase(),
    );
    const aRecords = snapshot.dns?.a || [];
    const serverHeader = (headers['server'] || '').toLowerCase();
    const viaHeader = (headers['via'] || '').toLowerCase();
    const certIssuer = (snapshot.ssl?.certificate?.issuer || '').toLowerCase();
    const certSan = (
      snapshot.ssl?.certificate?.subjectAltName || ''
    ).toLowerCase();
    const technologies = (snapshot.technology?.technologies || []).map((t) =>
      (typeof t === 'string' ? t : t.name || '').toLowerCase(),
    );

    // 1. Akamai Connected Cloud / Edge Infrastructure
    if (
      cnames.some((c) =>
        /edgekey\.net|edgesuite\.net|akamaiedge\.net|akamai\.net/i.test(c),
      ) ||
      serverHeader.includes('akamaighost') ||
      headers['x-akamai-transformed'] ||
      headers['akamai-grn'] ||
      nsRecords.some((n) => n.includes('akam.net'))
    ) {
      signals.push({
        type: 'DNS',
        source: 'CNAME / Akamai Edge',
        indicator: 'Akamai edge routing network',
        matched: true,
        weight: 8,
        details: cnames.join(', ') || 'Akamai Edge',
      });
      addScore('Akamai Connected Cloud', 8, 'Akamai Edge Network');
    }

    // 2. Microsoft Azure / Cloud
    if (
      cnames.some((c) =>
        /azurewebsites\.net|cloudapp\.azure\.com|trafficmanager\.net|azure-api\.net|azureedge\.net/i.test(
          c,
        ),
      ) ||
      headers['x-ms-request-id'] ||
      headers['x-azure-ref']
    ) {
      signals.push({
        type: 'DNS',
        source: 'Azure CNAME / Headers',
        indicator: 'Microsoft Azure Cloud infrastructure',
        matched: true,
        weight: 8,
        details: cnames.join(', ') || 'Azure Headers',
      });
      addScore('Microsoft Azure', 8, 'Azure Cloud');
    }

    // 3. Google Cloud Platform (GCP)
    if (
      cnames.some((c) => /appspot\.com|cloud\.google\.com|run\.app/i.test(c)) ||
      headers['x-cloud-trace-context'] ||
      headers['x-goog-meta']
    ) {
      signals.push({
        type: 'DNS',
        source: 'GCP CNAME / Headers',
        indicator: 'Google Cloud Platform infrastructure',
        matched: true,
        weight: 8,
        details: cnames.join(', ') || 'GCP Headers',
      });
      addScore('Google Cloud Platform (GCP)', 8, 'GCP Cloud');
    }

    // 4. Amazon Web Services (AWS)
    if (
      cnames.some((c) =>
        /amazonaws\.com|elasticbeanstalk\.com|elb\.amazonaws\.com/i.test(c),
      ) ||
      serverHeader.includes('amazons3') ||
      serverHeader.includes('awselb') ||
      headers['x-amzn-trace-id']
    ) {
      signals.push({
        type: 'DNS',
        source: 'AWS CNAME / Headers',
        indicator: 'AWS Cloud infrastructure',
        matched: true,
        weight: 8,
        details: cnames.join(', ') || 'AWS Headers',
      });
      addScore('Amazon Web Services (AWS)', 8, 'AWS Infrastructure');
    }

    // 5. Replit Evaluation
    let replitSignals = 0;
    if (cnames.some((c) => /replit\.(app|dev)|repl\.co|replit\.com/i.test(c))) {
      signals.push({
        type: 'DNS',
        source: 'CNAME',
        indicator: 'Replit CNAME target',
        matched: true,
        weight: 6,
        details: cnames.join(', '),
      });
      addScore('Replit', 6, 'DNS CNAME target');
      replitSignals++;
    }
    if (
      headers['x-replit-user'] ||
      headers['x-replit-app'] ||
      headers['x-replit-repl-id'] ||
      headers['replit-cluster']
    ) {
      signals.push({
        type: 'HTTP',
        source: 'Headers',
        indicator: 'Replit deployment headers',
        matched: true,
        weight: 6,
        details: 'Replit-specific platform header detected',
      });
      addScore('Replit', 6, 'Replit HTTP header');
      replitSignals++;
    }
    if (certSan.includes('replit.app') || certSan.includes('replit.dev')) {
      signals.push({
        type: 'TLS',
        source: 'Certificate SAN',
        indicator: 'Replit domain SAN',
        matched: true,
        weight: 5,
        details: certSan,
      });
      addScore('Replit', 5, 'TLS SAN');
      replitSignals++;
    }
    if (technologies.includes('replit')) {
      signals.push({
        type: 'TECH',
        source: 'Technology Fingerprint',
        indicator: 'Replit technology signature',
        matched: true,
        weight: 3,
        details: 'Replit environment',
      });
      addScore('Replit', 3, 'Technology signature');
      replitSignals++;
    }

    // 6. Vercel Evaluation
    let vercelSignals = 0;
    if (cnames.some((c) => /vercel-dns\.com|vercel\.app/i.test(c))) {
      signals.push({
        type: 'DNS',
        source: 'CNAME',
        indicator: 'Vercel CNAME target',
        matched: true,
        weight: 6,
        details: cnames.join(', '),
      });
      addScore('Vercel', 6, 'DNS CNAME target');
      vercelSignals++;
    }
    if (aRecords.includes('76.76.21.21')) {
      signals.push({
        type: 'IP_ASN',
        source: 'A Record / Anycast',
        indicator: 'Vercel Anycast IP (76.76.21.21)',
        matched: true,
        weight: 6,
        details: '76.76.21.21',
      });
      addScore('Vercel', 6, 'Vercel Anycast IP');
      vercelSignals++;
    }
    if (headers['x-vercel-id'] || headers['x-vercel-cache']) {
      signals.push({
        type: 'HTTP',
        source: 'Headers',
        indicator: 'Vercel deployment header',
        matched: true,
        weight: 5,
        details: 'x-vercel-id',
      });
      addScore('Vercel', 5, 'Vercel HTTP header');
      vercelSignals++;
    }
    if (serverHeader === 'vercel') {
      signals.push({
        type: 'HTTP',
        source: 'Server Header',
        indicator: 'Server: Vercel',
        matched: true,
        weight: 3,
        details: 'Server: Vercel',
      });
      addScore('Vercel', 3, 'Server: Vercel header');
      vercelSignals++;
    }
    if (certSan.includes('vercel.app')) {
      signals.push({
        type: 'TLS',
        source: 'Certificate SAN',
        indicator: 'Vercel domain SAN',
        matched: true,
        weight: 5,
        details: certSan,
      });
      addScore('Vercel', 5, 'TLS SAN');
      vercelSignals++;
    }

    // 7. Netlify Evaluation
    if (
      cnames.some((c) => /netlify\.app/i.test(c)) ||
      headers['x-nf-request-id']
    ) {
      signals.push({
        type: 'HTTP',
        source: 'Netlify Indicators',
        indicator: 'Netlify platform signals',
        matched: true,
        weight: 6,
        details: 'Netlify CNAME / Header',
      });
      addScore('Netlify', 6, 'Netlify signals');
    }

    // 8. GitHub Pages Evaluation
    if (
      cnames.some((c) => /github\.io/i.test(c)) ||
      headers['x-github-request-id']
    ) {
      signals.push({
        type: 'HTTP',
        source: 'GitHub Pages Indicators',
        indicator: 'GitHub Pages signals',
        matched: true,
        weight: 6,
        details: 'GitHub Pages CNAME / Header',
      });
      addScore('GitHub Pages', 6, 'GitHub Pages signals');
    }

    // 9. Fly.io Evaluation
    if (cnames.some((c) => /fly\.dev/i.test(c)) || headers['fly-request-id']) {
      signals.push({
        type: 'HTTP',
        source: 'Fly.io Indicators',
        indicator: 'Fly.io signals',
        matched: true,
        weight: 6,
        details: 'Fly.io CNAME / Header',
      });
      addScore('Fly.io', 6, 'Fly.io signals');
    }

    // 10. Render Evaluation
    if (
      cnames.some((c) => /onrender\.com/i.test(c)) ||
      headers['x-render-origin-server']
    ) {
      signals.push({
        type: 'HTTP',
        source: 'Render Indicators',
        indicator: 'Render platform signals',
        matched: true,
        weight: 6,
        details: 'Render CNAME / Header',
      });
      addScore('Render', 6, 'Render signals');
    }

    // 11. Enterprise / Banking / Dedicated Datacenter
    // E.g. hdfc.bank.in, hdfcbank.com, sbi.co.in, icicibank.com, private enterprise nameservers
    if (
      nsRecords.some((n) =>
        /bank\.in|hdfc|sbi|icici|axis|corp|internal/i.test(n),
      ) ||
      cnames.some((c) => /bank\.in|hdfc|sbi|icici|corp|internal/i.test(c))
    ) {
      signals.push({
        type: 'DNS',
        source: 'Enterprise Nameservers',
        indicator: 'Dedicated Enterprise Infrastructure',
        matched: true,
        weight: 7,
        details: nsRecords.join(', '),
      });
      addScore(
        'Enterprise / Dedicated Datacenter',
        7,
        'Enterprise DNS Infrastructure',
      );
    }

    const candidateList: CandidateProvider[] = Array.from(candidates.entries())
      .map(([provider, data]) => ({
        provider,
        score: data.score,
        signals: data.signals,
      }))
      .sort((a, b) => b.score - a.score);

    // Conflict Detection
    const conflicts: ProviderConflict[] = [];
    if (candidateList.length >= 2) {
      const first = candidateList[0];
      const second = candidateList[1];

      if (
        first.score >= 3 &&
        second.score >= 3 &&
        first.provider !== second.provider
      ) {
        conflicts.push({
          providerA: first.provider,
          providerB: second.provider,
          reason: `Conflicting origin hosting signals observed between ${first.provider} (${first.signals.join(', ')}) and ${second.provider} (${second.signals.join(', ')}).`,
        });
      }
    }

    if (conflicts.length > 0) {
      return {
        role: 'HOSTING',
        provider: null,
        decision: 'CONFLICTED',
        confidence: 'INCONCLUSIVE',
        signals,
        candidateProviders: candidateList,
        conflicts,
        explanation: `Hosting provider attribution is inconclusive. Observed signals indicate multiple infrastructure providers: ${candidateList.map((c) => `${c.provider} (${c.signals.join(', ')})`).join(' vs ')}. Nebula cannot confidently determine the origin deployment provider.`,
      };
    }

    if (candidateList.length === 0) {
      return {
        role: 'HOSTING',
        provider: null,
        decision: 'UNKNOWN',
        confidence: 'LOW',
        signals,
        candidateProviders: [],
        conflicts: [],
        explanation:
          'Hosting provider could not be established from available DNS, HTTP, and TLS telemetry.',
      };
    }

    const top = candidateList[0];
    const isMultiSignal = top.signals.length >= 2;
    const hasDnsOrNetwork = top.signals.some(
      (s) => s.includes('DNS') || s.includes('IP') || s.includes('TLS'),
    );

    if (top.score >= 10 || (isMultiSignal && hasDnsOrNetwork)) {
      return {
        role: 'HOSTING',
        provider: top.provider,
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals,
        candidateProviders: candidateList,
        conflicts: [],
        explanation: `Authoritatively confirmed deployment on ${top.provider} via correlated ${top.signals.join(' and ')}.`,
      };
    }

    if (top.score >= 5) {
      return {
        role: 'HOSTING',
        provider: top.provider,
        decision: 'STRONGLY_INFERRED',
        confidence: 'HIGH',
        signals,
        candidateProviders: candidateList,
        conflicts: [],
        explanation: `Strongly inferred deployment on ${top.provider} based on ${top.signals.join(', ')}.`,
      };
    }

    return {
      role: 'HOSTING',
      provider: top.provider,
      decision: 'INFERRED',
      confidence: 'MEDIUM',
      signals,
      candidateProviders: candidateList,
      conflicts: [],
      explanation: `Inferred deployment on ${top.provider} based on ${top.signals.join(', ')}. Additional signals needed for full confirmation.`,
    };
  }

  private attributeEdgeCdn(
    snapshot: DiscoverySnapshot,
  ): ProviderAttributionRecord {
    const headers = snapshot.http?.headers || {};
    const cnames = (snapshot.dns?.cname || []).map((c) =>
      String(c).toLowerCase(),
    );
    const signals: AttributionSignal[] = [];

    // Cloudflare Edge
    if (
      headers['cf-ray'] ||
      headers['cf-cache-status'] ||
      (headers['server'] || '').toLowerCase() === 'cloudflare'
    ) {
      signals.push({
        type: 'HTTP',
        source: 'Cloudflare Headers',
        indicator: 'CF-Ray / Server: Cloudflare',
        matched: true,
        weight: 8,
      });
      return {
        role: 'EDGE_CDN',
        provider: 'Cloudflare',
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals,
        candidateProviders: [
          {
            provider: 'Cloudflare',
            score: 8,
            signals: ['CF-Ray header', 'Cloudflare Edge'],
          },
        ],
        conflicts: [],
        explanation: 'Cloudflare Edge reverse proxy active and verified.',
      };
    }

    // Akamai Edge
    if (
      cnames.some((c) =>
        /edgekey\.net|edgesuite\.net|akamaiedge\.net|akamai\.net/i.test(c),
      ) ||
      (headers['server'] || '').toLowerCase().includes('akamaighost') ||
      headers['x-akamai-transformed'] ||
      headers['akamai-grn']
    ) {
      signals.push({
        type: 'HTTP',
        source: 'Akamai Edge Headers / CNAME',
        indicator: 'Akamai Intelligent Edge Network',
        matched: true,
        weight: 8,
      });
      return {
        role: 'EDGE_CDN',
        provider: 'Akamai Edge Network',
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals,
        candidateProviders: [
          {
            provider: 'Akamai Edge Network',
            score: 8,
            signals: ['Akamai Edge Network'],
          },
        ],
        conflicts: [],
        explanation:
          'Akamai Intelligent Edge distribution and security active.',
      };
    }

    // AWS CloudFront
    if (
      cnames.some((c) => c.includes('cloudfront.net')) ||
      headers['x-amz-cf-id'] ||
      headers['x-amz-cf-pop']
    ) {
      signals.push({
        type: 'HTTP',
        source: 'CloudFront Headers',
        indicator: 'CloudFront CNAME / Headers',
        matched: true,
        weight: 8,
      });
      return {
        role: 'EDGE_CDN',
        provider: 'AWS CloudFront',
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals,
        candidateProviders: [
          {
            provider: 'AWS CloudFront',
            score: 8,
            signals: ['CloudFront Edge'],
          },
        ],
        conflicts: [],
        explanation: 'AWS CloudFront CDN edge proxy active.',
      };
    }

    // Fastly
    if (headers['x-fastly-request-id'] || headers['fastly-debug-digest']) {
      signals.push({
        type: 'HTTP',
        source: 'Fastly Headers',
        indicator: 'Fastly headers',
        matched: true,
        weight: 8,
      });
      return {
        role: 'EDGE_CDN',
        provider: 'Fastly',
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals,
        candidateProviders: [
          { provider: 'Fastly', score: 8, signals: ['Fastly Edge'] },
        ],
        conflicts: [],
        explanation: 'Fastly Edge CDN verified.',
      };
    }

    // Vercel Edge
    if (headers['x-vercel-id']) {
      signals.push({
        type: 'HTTP',
        source: 'Vercel Edge Headers',
        indicator: 'x-vercel-id header',
        matched: true,
        weight: 6,
      });
      return {
        role: 'EDGE_CDN',
        provider: 'Vercel Edge Network',
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals,
        candidateProviders: [
          {
            provider: 'Vercel Edge Network',
            score: 6,
            signals: ['Vercel Edge'],
          },
        ],
        conflicts: [],
        explanation: 'Vercel Edge Network proxy active.',
      };
    }

    return {
      role: 'EDGE_CDN',
      provider: null,
      decision: 'UNKNOWN',
      confidence: 'LOW',
      signals: [],
      candidateProviders: [],
      conflicts: [],
      explanation: 'No edge reverse proxy or CDN detected.',
    };
  }

  private attributeDnsProvider(
    snapshot: DiscoverySnapshot,
  ): ProviderAttributionRecord {
    const ns = (snapshot.dns?.ns || []).map((n) => String(n).toLowerCase());
    const signals: AttributionSignal[] = [];

    if (ns.some((n) => n.includes('cloudflare.com'))) {
      signals.push({
        type: 'DNS',
        source: 'Nameservers',
        indicator: 'Cloudflare NS',
        matched: true,
        weight: 8,
      });
      return {
        role: 'DNS',
        provider: 'Cloudflare',
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals,
        candidateProviders: [
          {
            provider: 'Cloudflare',
            score: 8,
            signals: ['Cloudflare Nameservers'],
          },
        ],
        conflicts: [],
        explanation: 'Authoritative DNS hosted on Cloudflare nameservers.',
      };
    }

    if (ns.some((n) => n.includes('awsdns'))) {
      signals.push({
        type: 'DNS',
        source: 'Nameservers',
        indicator: 'Route53 NS',
        matched: true,
        weight: 8,
      });
      return {
        role: 'DNS',
        provider: 'AWS Route53',
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals,
        candidateProviders: [
          {
            provider: 'AWS Route53',
            score: 8,
            signals: ['AWS Route53 Nameservers'],
          },
        ],
        conflicts: [],
        explanation: 'Authoritative DNS hosted on AWS Route 53.',
      };
    }

    if (ns.some((n) => n.includes('akam.net') || n.includes('akamai'))) {
      return {
        role: 'DNS',
        provider: 'Akamai Edge DNS',
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals: [],
        candidateProviders: [
          {
            provider: 'Akamai Edge DNS',
            score: 8,
            signals: ['Akamai Nameservers'],
          },
        ],
        conflicts: [],
        explanation: 'Authoritative DNS hosted on Akamai Edge DNS.',
      };
    }

    if (ns.some((n) => n.includes('vercel-dns.com'))) {
      signals.push({
        type: 'DNS',
        source: 'Nameservers',
        indicator: 'Vercel NS',
        matched: true,
        weight: 8,
      });
      return {
        role: 'DNS',
        provider: 'Vercel DNS',
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals,
        candidateProviders: [
          {
            provider: 'Vercel DNS',
            score: 8,
            signals: ['Vercel DNS Nameservers'],
          },
        ],
        conflicts: [],
        explanation: 'Authoritative DNS hosted on Vercel DNS.',
      };
    }

    if (
      ns.some(
        (n) => n.includes('googledomains.com') || n.includes('google.com'),
      )
    ) {
      return {
        role: 'DNS',
        provider: 'Google Cloud DNS',
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals: [],
        candidateProviders: [
          {
            provider: 'Google Cloud DNS',
            score: 8,
            signals: ['Google Nameservers'],
          },
        ],
        conflicts: [],
        explanation: 'Authoritative DNS hosted on Google Cloud DNS.',
      };
    }

    if (ns.some((n) => n.includes('azure-dns'))) {
      return {
        role: 'DNS',
        provider: 'Azure DNS',
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals: [],
        candidateProviders: [
          {
            provider: 'Azure DNS',
            score: 8,
            signals: ['Azure Nameservers'],
          },
        ],
        conflicts: [],
        explanation: 'Authoritative DNS hosted on Azure DNS.',
      };
    }

    if (ns.length > 0) {
      return {
        role: 'DNS',
        provider: ns[0],
        decision: 'INFERRED',
        confidence: 'MEDIUM',
        signals: [],
        candidateProviders: [{ provider: ns[0], score: 5, signals: [ns[0]] }],
        conflicts: [],
        explanation: `Authoritative DNS active on ${ns.join(', ')}.`,
      };
    }

    return {
      role: 'DNS',
      provider: null,
      decision: 'UNKNOWN',
      confidence: 'LOW',
      signals: [],
      candidateProviders: [],
      conflicts: [],
      explanation: 'DNS nameservers could not be resolved.',
    };
  }

  private attributeWebServer(
    snapshot: DiscoverySnapshot,
  ): ProviderAttributionRecord {
    const serverHeader = snapshot.http?.headers?.['server'];
    const xPoweredBy = (
      snapshot.http?.headers?.['x-powered-by'] || ''
    ).toLowerCase();
    const viaHeader = (snapshot.http?.headers?.['via'] || '').toLowerCase();
    const rawHeaders = snapshot.http?.headers || {};
    const techs = (snapshot.technology?.technologies || []).map((t: any) =>
      typeof t === 'string' ? t : t.name,
    );

    // 1. Direct Server Header
    if (serverHeader) {
      return {
        role: 'WEB_SERVER',
        provider: serverHeader,
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals: [
          {
            type: 'HTTP',
            source: 'Server Header',
            indicator: `Server: ${serverHeader}`,
            matched: true,
            weight: 8,
          },
        ],
        candidateProviders: [
          {
            provider: serverHeader,
            score: 8,
            signals: [`Server: ${serverHeader}`],
          },
        ],
        conflicts: [],
        explanation: `Observed HTTP Server response header: '${serverHeader}'.`,
      };
    }

    // 2. Correlate with detected web server technologies
    const detectedServer = techs.find((t) =>
      /iis|nginx|apache|akamai|litespeed|openresty|caddy|envoy|big-ip|tomcat|jetty/i.test(
        t,
      ),
    );
    if (detectedServer) {
      return {
        role: 'WEB_SERVER',
        provider: detectedServer,
        decision: 'STRONGLY_INFERRED',
        confidence: 'HIGH',
        signals: [
          {
            type: 'TECH',
            source: 'Technology Discovery',
            indicator: detectedServer,
            matched: true,
            weight: 7,
          },
        ],
        candidateProviders: [
          { provider: detectedServer, score: 7, signals: [detectedServer] },
        ],
        conflicts: [],
        explanation: `Identified web server from correlated infrastructure fingerprint: ${detectedServer}.`,
      };
    }

    // 3. Correlate with headers / X-Powered-By
    if (
      xPoweredBy.includes('asp.net') ||
      rawHeaders['x-aspnet-version'] ||
      rawHeaders['x-aspnetmvc-version']
    ) {
      return {
        role: 'WEB_SERVER',
        provider: 'Microsoft IIS',
        decision: 'STRONGLY_INFERRED',
        confidence: 'HIGH',
        signals: [
          {
            type: 'HTTP',
            source: 'ASP.NET Headers',
            indicator: 'ASP.NET Runtime',
            matched: true,
            weight: 7,
          },
        ],
        candidateProviders: [
          { provider: 'Microsoft IIS', score: 7, signals: ['ASP.NET Runtime'] },
        ],
        conflicts: [],
        explanation:
          'Identified Microsoft IIS web server from active ASP.NET response headers.',
      };
    }

    if (
      viaHeader.includes('akamai') ||
      rawHeaders['x-akamai-transformed'] ||
      rawHeaders['akamai-grn']
    ) {
      return {
        role: 'WEB_SERVER',
        provider: 'Akamai Edge Server',
        decision: 'STRONGLY_INFERRED',
        confidence: 'HIGH',
        signals: [
          {
            type: 'HTTP',
            source: 'Akamai Headers',
            indicator: 'Akamai Edge Headers',
            matched: true,
            weight: 7,
          },
        ],
        candidateProviders: [
          {
            provider: 'Akamai Edge Server',
            score: 7,
            signals: ['Akamai Edge'],
          },
        ],
        conflicts: [],
        explanation:
          'Identified Akamai edge server from active routing headers.',
      };
    }

    // 4. If endpoint is reachable and healthy but server banner is omitted for security
    if (snapshot.http?.reachable) {
      return {
        role: 'WEB_SERVER',
        provider: 'Custom / Hardened Web Server',
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals: [
          {
            type: 'HTTP',
            source: 'Security Hardening',
            indicator: 'Suppressed Server Banner',
            matched: true,
            weight: 6,
          },
        ],
        candidateProviders: [
          {
            provider: 'Custom / Hardened Web Server',
            score: 6,
            signals: ['Suppressed Banner'],
          },
        ],
        conflicts: [],
        explanation:
          'Web server banner is intentionally suppressed for security hardening.',
      };
    }

    return {
      role: 'WEB_SERVER',
      provider: null,
      decision: 'UNKNOWN',
      confidence: 'LOW',
      signals: [],
      candidateProviders: [],
      conflicts: [],
      explanation: 'No explicit HTTP Server banner published.',
    };
  }

  private attributeApplication(
    snapshot: DiscoverySnapshot,
  ): ProviderAttributionRecord {
    const techs = (snapshot.technology?.technologies || []).map((t: any) =>
      typeof t === 'string' ? t : t.name,
    );
    const appFramework = techs.find((t: string) =>
      /next\.js|react|vue|angular|asp\.net|php|django|rails|laravel|wordpress|svelte|remix|gatsby|java enterprise/i.test(
        t,
      ),
    );

    if (appFramework) {
      return {
        role: 'APPLICATION',
        provider: appFramework,
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals: [
          {
            type: 'TECH',
            source: 'Technology Discovery',
            indicator: appFramework,
            matched: true,
            weight: 8,
          },
        ],
        candidateProviders: [
          { provider: appFramework, score: 8, signals: [appFramework] },
        ],
        conflicts: [],
        explanation: `Application framework identified: ${appFramework}.`,
      };
    }

    // Correlate with headers
    const xPoweredBy = snapshot.http?.headers?.['x-powered-by'];
    if (xPoweredBy) {
      return {
        role: 'APPLICATION',
        provider: xPoweredBy,
        decision: 'CONFIRMED',
        confidence: 'HIGH',
        signals: [
          {
            type: 'HTTP',
            source: 'X-Powered-By Header',
            indicator: xPoweredBy,
            matched: true,
            weight: 8,
          },
        ],
        candidateProviders: [
          { provider: xPoweredBy, score: 8, signals: [xPoweredBy] },
        ],
        conflicts: [],
        explanation: `Application runtime identified from X-Powered-By: ${xPoweredBy}.`,
      };
    }

    return {
      role: 'APPLICATION',
      provider: null,
      decision: 'UNKNOWN',
      confidence: 'LOW',
      signals: [],
      candidateProviders: [],
      conflicts: [],
      explanation: 'No distinct application framework signature detected.',
    };
  }
}
