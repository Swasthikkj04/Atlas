import { Injectable, Logger } from '@nestjs/common';
import { OAuthProvider } from '@prisma/client';
import { AuthService } from './auth.service';
import {
  OAuthIdentityResolver,
  OAuthProfile,
} from '../resolvers/oauth-identity.resolver';
import { NormalizedGoogleProfile } from '../mappers/google-profile.mapper';
import { DeviceMetadata } from '../utils/user-agent.parser';
import { OAuthAuthenticationException } from '../exceptions/oauth.exception';

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    private readonly identityResolver: OAuthIdentityResolver,
    private readonly authService: AuthService,
  ) {}

  async resolveAndAuthenticateGoogleUser(
    profile: NormalizedGoogleProfile,
    deviceMeta: DeviceMetadata,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
    event: string;
  }> {
    if (!profile.email || !profile.googleId) {
      this.logger.error(
        'Google Login Failed: Missing required Google profile claims',
      );
      throw new OAuthAuthenticationException(
        'oauth_invalid_request',
        'Invalid Google profile response.',
      );
    }

    const oauthProfile: OAuthProfile = {
      provider: OAuthProvider.GOOGLE,
      providerUserId: profile.googleId,
      email: profile.email,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
    };

    // 1. Resolve Identity via OAuthIdentityResolver (Cases A-D)
    const { user, event } =
      await this.identityResolver.resolveUser(oauthProfile);

    // 2. Canonical Session & Token Establishment via AuthService (AUTH-011)
    const { accessToken, refreshToken } =
      await this.authService.establishSession(user, deviceMeta);

    this.logger.log(
      `Google OAuth authenticated: User=${user.id} Event=${event}`,
    );

    return {
      accessToken,
      refreshToken,
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
