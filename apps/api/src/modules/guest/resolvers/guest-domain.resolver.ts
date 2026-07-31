import { Injectable } from '@nestjs/common';
import { Domain } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  SYSTEM_GUEST_EMAIL,
  SYSTEM_GUEST_NAME,
  SYSTEM_GUEST_USER_ID,
} from '../constants/guest.constants';

@Injectable()
export class GuestDomainResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolveGuestDomain(targetDomain: string): Promise<Domain> {
    const normalizedDomain = targetDomain.trim().toLowerCase();

    // Step 1: Ensure System Guest User exists for foreign key integrity
    await this.prisma.user.upsert({
      where: { id: SYSTEM_GUEST_USER_ID },
      update: {},
      create: {
        id: SYSTEM_GUEST_USER_ID,
        email: SYSTEM_GUEST_EMAIL,
        fullName: SYSTEM_GUEST_NAME,
        passwordHash: 'SYSTEM_GUEST_NO_AUTH',
      },
    });

    // Step 2: Resolve or create domain under System Guest Identity
    let domain = await this.prisma.domain.findFirst({
      where: {
        userId: SYSTEM_GUEST_USER_ID,
        domainName: normalizedDomain,
      },
    });

    if (!domain) {
      domain = await this.prisma.domain.create({
        data: {
          userId: SYSTEM_GUEST_USER_ID,
          domainName: normalizedDomain,
          monitoringEnabled: false,
        },
      });
    }

    return domain;
  }
}
