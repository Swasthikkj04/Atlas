import { Injectable } from '@nestjs/common';
import { OAuthAccount, OAuthProvider } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export interface CreateOAuthAccountDto {
  userId: string;
  provider: OAuthProvider;
  providerUserId: string;
  providerEmail: string;
}

@Injectable()
export class OAuthAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async findAccount(
    provider: OAuthProvider,
    providerUserId: string,
  ): Promise<(OAuthAccount & { user: any }) | null> {
    return this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
      include: { user: true },
    });
  }

  async createAccount(dto: CreateOAuthAccountDto): Promise<OAuthAccount> {
    return this.prisma.oAuthAccount.create({
      data: {
        userId: dto.userId,
        provider: dto.provider,
        providerUserId: dto.providerUserId,
        providerEmail: dto.providerEmail,
      },
    });
  }

  async findByUserId(userId: string): Promise<OAuthAccount[]> {
    return this.prisma.oAuthAccount.findMany({
      where: { userId },
    });
  }
}
