import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { OAuthProvider, User, UserAccountStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { OAuthAccountService } from '../services/oauth-account.service';

export interface OAuthProfile {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface ResolutionResult {
  user: User;
  event:
    'GOOGLE_LOGIN_SUCCESS' | 'GOOGLE_ACCOUNT_LINKED' | 'GOOGLE_ACCOUNT_CREATED';
}

@Injectable()
export class OAuthIdentityResolver {
  private readonly logger = new Logger(OAuthIdentityResolver.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly oauthAccountService: OAuthAccountService,
  ) {}

  async resolveUser(profile: OAuthProfile): Promise<ResolutionResult> {
    if (!profile.email || !profile.providerUserId) {
      throw new UnauthorizedException('Invalid OAuth profile payload.');
    }

    const now = new Date();
    const normalizedEmail = profile.email.trim().toLowerCase();

    // 1. Case A: Check if OAuthAccount is already linked
    const existingOAuth = await this.oauthAccountService.findAccount(
      profile.provider,
      profile.providerUserId,
    );

    if (existingOAuth) {
      this.logger.log(
        `OAuth Resolution Case A (Existing Linked Account): User=${existingOAuth.userId} Provider=${profile.provider}`,
      );

      const user = await this.prisma.user.update({
        where: { id: existingOAuth.userId },
        data: {
          lastLoginAt: now,
          avatarUrl: profile.avatarUrl || existingOAuth.user.avatarUrl,
        },
      });

      return { user, event: 'GOOGLE_LOGIN_SUCCESS' };
    }

    // 2. Case B & C: Check if User exists by verified/unverified email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const isPending =
        existingUser.status === UserAccountStatus.PENDING_VERIFICATION;
      const caseName = isPending
        ? 'Case C (Pending Account Upgraded & Linked)'
        : 'Case B (Verified Local Account Linked)';

      this.logger.log(`OAuth Resolution ${caseName}: User=${existingUser.id}`);

      // Case C: Upgrade PENDING_VERIFICATION account to ACTIVE since provider verified ownership
      const user = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          status: UserAccountStatus.ACTIVE,
          emailVerifiedAt: existingUser.emailVerifiedAt || now,
          lastLoginAt: now,
          avatarUrl: profile.avatarUrl || existingUser.avatarUrl,
        },
      });

      // Link OAuthAccount
      await this.oauthAccountService.createAccount({
        userId: user.id,
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        providerEmail: normalizedEmail,
      });

      return { user, event: 'GOOGLE_ACCOUNT_LINKED' };
    }

    // 3. Case D: Completely New User Provisioning
    this.logger.log(
      `OAuth Resolution Case D (Provisioning New User): Email=${normalizedEmail}`,
    );

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: profile.fullName || 'OAuth User',
        avatarUrl: profile.avatarUrl,
        status: UserAccountStatus.ACTIVE,
        emailVerifiedAt: now,
        lastLoginAt: now,
        passwordHash: null,
        oauthAccounts: {
          create: {
            provider: profile.provider,
            providerUserId: profile.providerUserId,
            providerEmail: normalizedEmail,
          },
        },
      },
    });

    return { user, event: 'GOOGLE_ACCOUNT_CREATED' };
  }
}
