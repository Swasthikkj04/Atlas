import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { OAuthProvider } from '@prisma/client';
import { AuthService } from './auth.service';
import {
  OAuthIdentityResolver,
  OAuthProfile,
} from '../resolvers/oauth-identity.resolver';
import { NormalizedGitHubProfile } from '../mappers/github-profile.mapper';
import { DeviceMetadata } from '../utils/user-agent.parser';

@Injectable()
export class GitHubAuthService {
  private readonly logger = new Logger(GitHubAuthService.name);

  constructor(
    private readonly identityResolver: OAuthIdentityResolver,
    private readonly authService: AuthService,
  ) {}

  async resolveAndAuthenticateGitHubUser(
    profile: NormalizedGitHubProfile,
    deviceMeta: DeviceMetadata,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
    event: string;
  }> {
    // AUTH-005.7 Security Rule: Verified email required for automatic account linking
    if (!profile.email || !profile.emailVerified) {
      this.logger.error(
        `GitHub Login Failed: User ID ${profile.githubId} does not have a verified email address`,
      );
      throw new UnauthorizedException(
        'GitHub account does not have a verified email address. Please configure and verify your email in GitHub settings before signing in.',
      );
    }

    const oauthProfile: OAuthProfile = {
      provider: OAuthProvider.GITHUB,
      providerUserId: profile.githubId,
      email: profile.email,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
    };

    // 1. Resolve Identity via provider-independent OAuthIdentityResolver (Cases A-D)
    const { user, event } =
      await this.identityResolver.resolveUser(oauthProfile);

    // Map provider event name
    const githubEvent = event.replace('GOOGLE_', 'GITHUB_');

    // 2. Canonical Session & Token Establishment via AuthService (AUTH-011)
    const { accessToken, refreshToken } =
      await this.authService.establishSession(user, deviceMeta);

    this.logger.log(
      `GitHub OAuth authenticated: User=${user.id} Event=${githubEvent}`,
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
      event: githubEvent,
    };
  }
}

