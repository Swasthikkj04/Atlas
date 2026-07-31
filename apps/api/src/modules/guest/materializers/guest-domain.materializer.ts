import { Injectable } from '@nestjs/common';
import { Domain } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class GuestDomainMaterializer {
  constructor(private readonly prisma: PrismaService) {}

  async materializeUserDomain(
    userId: string,
    domainName: string,
    sourceJobId: string,
  ): Promise<Domain> {
    const normalizedDomain = domainName.trim().toLowerCase();

    // 1. Create or resolve customer-owned Domain for the new User
    let domain = await this.prisma.domain.findFirst({
      where: {
        userId,
        domainName: normalizedDomain,
      },
    });

    if (!domain) {
      domain = await this.prisma.domain.create({
        data: {
          userId,
          domainName: normalizedDomain,
          monitoringEnabled: true,
        },
      });
    }

    // 2. Fetch source guest understanding job with snapshot details
    const sourceJob = await this.prisma.understandingJob.findUnique({
      where: { id: sourceJobId },
      include: {
        infrastructureSnapshot: true,
      },
    });

    if (sourceJob && sourceJob.infrastructureSnapshot) {
      // Ensure customer domain has an active understanding snapshot copy
      const existingSnapshot = await this.prisma.infrastructureSnapshot.findFirst({
        where: { domainId: domain.id },
      });

      if (!existingSnapshot) {
        try {
          await this.prisma.understandingJob.create({
            data: {
              domainId: domain.id,
              status: sourceJob.status,
              trigger: sourceJob.trigger,
              durationMs: sourceJob.durationMs,
              completedAt: sourceJob.completedAt,
            },
          });
        } catch {
          // Idempotency safeguard
        }
      }
    }

    return domain;
  }
}
