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
      };
    }

    const payload = snapshot.payload as unknown as DiscoverySnapshot;
    const attribution =
      payload.attribution ??
      attributionService.attributeInfrastructure(payload);

    return {
      ipv4Addresses: payload.dns?.a ?? [],

      ipv6Addresses: payload.dns?.aaaa ?? [],

      webServer:
        attribution.webServer.provider ??
        payload.http?.headers?.server ??
        null,

      cdn: attribution.edgeCdn.provider ?? null,

      sslValid: payload.ssl?.authorized ?? false,

      sslExpiresAt: payload.ssl?.certificate?.validTo
        ? new Date(payload.ssl.certificate.validTo)
        : null,

      technologies:
        payload.technology?.technologies?.map((technology: any) =>
          typeof technology === 'string' ? technology : technology.name
        ) ?? [],

      httpStatus: snapshot.httpStatus,

      responseTimeMs: snapshot.responseTimeMs,

      hostingProvider: attribution.hosting.provider,
      hostingDecision: attribution.hosting.decision,
      hostingConfidence: attribution.hosting.confidence,
      hostingExplanation: attribution.hosting.explanation,

      edgeProvider: attribution.edgeCdn.provider,
      edgeConfidence: attribution.edgeCdn.confidence,

      dnsProvider: attribution.dns.provider,
      dnsConfidence: attribution.dns.confidence,

      attribution,
    };
  }
}
