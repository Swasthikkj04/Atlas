import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuthProvider, UserAccountStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { UserSessionService } from './user-session.service';
import { NormalizedGoogleProfile } from '../mappers/google-profile.mapper';
import { DeviceMetadata } from '../utils/user-agent.parser';

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: UserSessionService,
    private readonly jwtService: JwtService,
  ) {}

  async resolveAndAuthenticateGoogleUser(
    profile: NormalizedGoogleProfile,
    deviceMeta: DeviceMetadata,
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    if (!profile.email || !profile.googleId) {
      throw new UnauthorizedException('Invalid Google profile response.');
    }

    const now = new Date();

    // 1. Identity Resolution Case 1: Existing Linked OAuth Account
    const existingOAuth = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: OAuthProvider.GOOGLE,
          providerUserId: profile.googleId,
        },
      },
      include: { user: true },
    });

    let user;

    if (existingOAuth) {
      this.logger.log(`Google OAuth Login (Linked Account): ${profile.email}`);
      user = await this.prisma.user.update({
        where: { id: existingOAuth.userId },
        data: {
          lastLoginAt: now,
          avatarUrl: profile.avatarUrl || existingOAuth.user.avatarUrl,
        },
      });
    } else {
      // 2. Identity Resolution Case 2 & 3: Match by Email
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        this.logger.log(`Google OAuth Linking Email: ${profile.email}`);

        // Upgrade PENDING_VERIFICATION account to ACTIVE since Google verified ownership
        user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            status: UserAccountStatus.ACTIVE,
            emailVerifiedAt: existingUser.emailVerifiedAt || now,
            lastLoginAt: now,
            avatarUrl: profile.avatarUrl || existingUser.avatarUrl,
          },
        });

        // Link OAuthAccount
        await this.prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: OAuthProvider.GOOGLE,
            providerUserId: profile.googleId,
            providerEmail: profile.email,
          },
        });
      } else {
        // 3. Identity Resolution Case 4: Completely New User
        this.logger.log(`Google OAuth Provisioning New User: ${profile.email}`);

        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            fullName: profile.fullName,
            avatarUrl: profile.avatarUrl,
            status: UserAccountStatus.ACTIVE,
            emailVerifiedAt: now,
            lastLoginAt: now,
            passwordHash: null,
            oauthAccounts: {
              create: {
                provider: OAuthProvider.GOOGLE,
                providerUserId: profile.googleId,
                providerEmail: profile.email,
              },
            },
          },
        });
      }
    }

    // 4. Issue Nebula Session & Access JWT via UserSessionService
    const iat = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.id,
      email: user.email,
      iat,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const { rawRefreshToken } = await this.sessionService.createSession(
      user.id,
      deviceMeta,
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
