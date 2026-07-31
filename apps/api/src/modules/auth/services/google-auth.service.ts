import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuthProvider } from '@prisma/client';
import { UserSessionService } from './user-session.service';
import { OAuthIdentityResolver, OAuthProfile } from '../resolvers/oauth-identity.resolver';
import { NormalizedGoogleProfile } from '../mappers/google-profile.mapper';
import { DeviceMetadata } from '../utils/user-agent.parser';

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    private readonly identityResolver: OAuthIdentityResolver,
    private readonly sessionService: UserSessionService,
    private readonly jwtService: JwtService,
  ) {}

  async resolveAndAuthenticateGoogleUser(
    profile: NormalizedGoogleProfile,
    deviceMeta: DeviceMetadata,
  ): Promise<{ accessToken: string; refreshToken: string; user: any; event: string }> {
    if (!profile.email || !profile.googleId) {
      this.logger.error('Google Login Failed: Missing required Google profile claims');
      throw new UnauthorizedException('Invalid Google profile response.');
    }

    const oauthProfile: OAuthProfile = {
      provider: OAuthProvider.GOOGLE,
      providerUserId: profile.googleId,
      email: profile.email,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
    };

    // 1. Resolve Identity via OAuthIdentityResolver (Cases A-D)
    const { user, event } = await this.identityResolver.resolveUser(oauthProfile);

    // 2. Issue Stateful Session & Access JWT via UserSessionService
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

    this.logger.log(`Google OAuth authenticated: User=${user.id} Event=${event}`);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
      event,
    };
  }
}
