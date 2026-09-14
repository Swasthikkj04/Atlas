import { InfrastructureSnapshot } from '@prisma/client';

import type { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { ProviderAttributionService } from '../../../infrastructure/attribution/services/provider-attribution.service';
import { InfrastructureOverviewDto } from '../dto/infrastructure-overview.dto';

const attributionService = new ProviderAttributionService();

export class InfrastructureOverviewMapper {
  static fromSnapshot(
    snapshot: InfrastructureSnapshot | null,
  ): InfrastructureOverviewDto {
    if (!snapshot) {
      return {
        ipv4Addresses: [],
        ipv6Addresses: [],
        webServer: null,
        cdn: null,
        sslValid: false,
        sslExpiresAt: null,
        technologies: [],
        httpStatus: 0,
        responseTimeMs: 0,
        hostingProvider: null,
        hostingDecision: 'UNKNOWN',
        hostingConfidence: 'LOW',
        hostingExplanation: null,
        edgeProvider: null,
        edgeConfidence: 'LOW',
        dnsProvider: null,
        dnsConfidence: 'LOW',
        attribution: null,
        technologyArchitecture: null,
      };
    }

    const payload = snapshot.payload as unknown as DiscoverySnapshot;
    const attribution =
      payload.attribution ??
      attributionService.attributeInfrastructure(payload);

    const brief = (payload.technology as any)?.architectureBrief;
    const technologyArchitecture = brief
      ? {
          architectureSummary: brief.summary,
          ingressPath: brief.architecturePath || brief.ingressPath || [],
          layers: brief.layers || [],
          keyTechnologies: brief.keyTechnologies || [],
          integrations: brief.integrations || [],
          knownUnknowns: brief.knownUnknowns || [],
          claimBoundaries: brief.claimBoundaries || [],
          confidence: brief.confidence,
        }
      : null;

    const edgeTech =
      brief?.layers?.find((l: any) => l.layer === 'EDGE' || l.layer === 'CDN')
        ?.technologies?.[0]?.name ||
      brief?.architecturePath?.find(
        (p: any) =>
          (p.layer === 'EDGE' || p.layer === 'CDN') &&
          p.technologyId !== 'public-endpoint',
      )?.technologyName;

    let cdn = attribution.edgeCdn.provider ?? edgeTech ?? null;
    if (cdn === 'Akamai Edge Network') {
      cdn = 'Akamai';
    }

    const dnsNs = (payload.dns?.ns || []).map((n: any) =>
      String(n).toLowerCase(),
    );
    let dnsProvider = attribution.dns.provider ?? null;
    if (!dnsProvider) {
      if (
        dnsNs.some(
          (n: string) => n.includes('googledomains') || n.includes('google'),
        )
      ) {
        dnsProvider = 'Google Cloud DNS';
      } else if (dnsNs.some((n: string) => n.includes('azure-dns'))) {
        dnsProvider = 'Azure DNS';
      } else if (dnsNs.some((n: string) => n.includes('cloudflare'))) {
        dnsProvider = 'Cloudflare DNS';
      }
    }

    return {
      ipv4Addresses: payload.dns?.a ?? [],

      ipv6Addresses: payload.dns?.aaaa ?? [],

      webServer:
        attribution.webServer.provider ?? payload.http?.headers?.server ?? null,

      cdn,

      sslValid: payload.ssl?.authorized ?? false,

      sslExpiresAt: payload.ssl?.certificate?.validTo
        ? new Date(payload.ssl.certificate.validTo)
        : null,

      technologies:
        payload.technology?.technologies?.map((technology: any) =>
          typeof technology === 'string' ? technology : technology.name,
        ) ?? [],

      httpStatus: snapshot.httpStatus,

      responseTimeMs: snapshot.responseTimeMs,

      hostingProvider: attribution.hosting.provider,
      hostingDecision: attribution.hosting.decision,
      hostingConfidence: attribution.hosting.confidence,
      hostingExplanation: attribution.hosting.explanation,

      edgeProvider: attribution.edgeCdn.provider,
      edgeConfidence: attribution.edgeCdn.confidence,

      dnsProvider,
      dnsConfidence: attribution.dns.confidence,

      attribution,
      technologyArchitecture,
    };
  }
}
