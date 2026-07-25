import { InfrastructureSnapshot } from '@prisma/client';

import type { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';

import { InfrastructureOverviewDto } from '../dto/infrastructure-overview.dto';

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
      };
    }

    const payload =
      snapshot.payload as unknown as DiscoverySnapshot;

    return {
      ipv4Addresses:
        payload.dns?.a ?? [],

      ipv6Addresses:
        payload.dns?.aaaa ?? [],

      webServer:
        payload.http?.headers?.server ?? null,

      // Atlas does not yet have dedicated CDN detection.
      cdn: null,

      sslValid:
        payload.ssl?.authorized ?? false,

      sslExpiresAt:
        payload.ssl?.certificate?.validTo
          ? new Date(payload.ssl.certificate.validTo)
          : null,

      technologies:
        payload.technology?.technologies.map(
          (technology) => technology.name,
        ) ?? [],

      httpStatus:
        snapshot.httpStatus,

      responseTimeMs:
        snapshot.responseTimeMs,
    };
  }
}