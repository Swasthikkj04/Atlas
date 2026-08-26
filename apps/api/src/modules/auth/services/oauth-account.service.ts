import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OAuthAccount, OAuthProvider } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  ConnectedProviderDto,
  ConnectedProvidersResponseDto,
} from '../dto/connected-providers-response.dto';

export interface CreateOAuthAccountDto {
  userId: string;
  provider: OAuthProvider;
  providerUserId: string;
  providerEmail: string;
}

export function maskProviderEmail(email?: string): string {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}••••@${domain}`;
  }
  return `${local[0]}••••${local[local.length - 1]}@${domain}`;
}

@Injectable()
export class OAuthAccountService {
  private readonly logger = new Logger(OAuthAccountService.name);

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

  async getProvidersForUser(
    userId: string,
  ): Promise<ConnectedProvidersResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const oauthAccounts = await this.prisma.oAuthAccount.findMany({
      where: { userId },
    });

    const hasPassword = Boolean(
      user.passwordHash && user.passwordHash.length > 0,
    );
    const totalAuthMethods = (hasPassword ? 1 : 0) + oauthAccounts.length;
    const canDisconnect = totalAuthMethods > 1;

    const googleAccount = oauthAccounts.find(
      (a) => a.provider === OAuthProvider.GOOGLE,
    );
    const githubAccount = oauthAccounts.find(
      (a) => a.provider === OAuthProvider.GITHUB,
    );

    const providers: ConnectedProviderDto[] = [
      {
        provider: 'google',
        name: 'Google',
        connected: Boolean(googleAccount),
        accountLabel: googleAccount
          ? maskProviderEmail(googleAccount.providerEmail)
          : null,
        canDisconnect: Boolean(googleAccount && canDisconnect),
      },
      {
        provider: 'github',
        name: 'GitHub',
        connected: Boolean(githubAccount),
        accountLabel: githubAccount
          ? maskProviderEmail(githubAccount.providerEmail)
          : null,
        canDisconnect: Boolean(githubAccount && canDisconnect),
      },
    ];

    return { providers };
  }

  async disconnectProvider(
    userId: string,
    provider: OAuthProvider,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const oauthAccounts = await this.prisma.oAuthAccount.findMany({
      where: { userId },
    });

    const targetAccount = oauthAccounts.find((a) => a.provider === provider);
    if (!targetAccount) {
      throw new NotFoundException(
        `${provider === OAuthProvider.GOOGLE ? 'Google' : 'GitHub'} is not connected to this account.`,
      );
    }

    const hasPassword = Boolean(
      user.passwordHash && user.passwordHash.length > 0,
    );
    const totalAuthMethods = (hasPassword ? 1 : 0) + oauthAccounts.length;

    // NO_FINAL_AUTH_METHOD_REMOVAL invariant
    if (totalAuthMethods <= 1) {
      throw new BadRequestException(
        'Cannot disconnect your only authentication method. Please add a password or connect another login method first to prevent account lockout.',
      );
    }

    await this.prisma.oAuthAccount.delete({
      where: { id: targetAccount.id },
    });

    this.logger.log(
      `[SecurityEvent:AUTH_PROVIDER_DISCONNECTED] userId=${userId} provider=${provider}`,
    );

    const providerDisplayName =
      provider === OAuthProvider.GOOGLE ? 'Google' : 'GitHub';
    return {
      message: `${providerDisplayName} account disconnected successfully.`,
    };
  }
}
