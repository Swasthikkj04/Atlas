import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { GitHubProfileMapper } from '../mappers/github-profile.mapper';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GitHubStrategy.name);

  constructor(@Optional() private readonly configService?: ConfigService) {
    const isProduction =
      configService?.get<string>('NODE_ENV') === 'production' ||
      process.env.NODE_ENV === 'production';
    const clientID =
      configService?.get<string>('GITHUB_CLIENT_ID') ||
      process.env.GITHUB_CLIENT_ID ||
      (isProduction ? '' : 'github-client-id-placeholder');
    const clientSecret =
      configService?.get<string>('GITHUB_CLIENT_SECRET') ||
      process.env.GITHUB_CLIENT_SECRET ||
      (isProduction ? '' : 'github-client-secret-placeholder');
    const callbackURL =
      configService?.get<string>('GITHUB_CALLBACK_URL') ||
      process.env.GITHUB_CALLBACK_URL ||
      (isProduction
        ? 'https://api.argonion.com/api/v1/auth/github/callback'
        : 'http://localhost:3000/api/v1/auth/github/callback');

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['read:user', 'user:email'],
      allRawEmails: true,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ): Promise<any> {
    try {
      // Direct API fallback if profile.emails is missing or unpopulated
      if ((!profile.emails || profile.emails.length === 0) && accessToken) {
        try {
          const res = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'User-Agent': 'Nebula-Atlas-Auth',
              Accept: 'application/vnd.github.v3+json',
            },
          });
          if (res.ok) {
            const rawEmails = (await res.json()) as Array<{
              email: string;
              verified: boolean;
              primary: boolean;
              visibility?: string;
            }>;
            if (Array.isArray(rawEmails)) {
              profile.emails = rawEmails.map((e) => ({
                value: e.email,
                verified: Boolean(e.verified),
                primary: Boolean(e.primary),
                visibility: e.visibility,
              }));
            }
          }
        } catch (fetchErr) {
          this.logger.warn(
            `Failed fallback fetch to GitHub emails API: ${(fetchErr as Error).message}`,
          );
        }
      }

      const normalizedProfile = GitHubProfileMapper.map(profile);
      done(null, normalizedProfile);
    } catch (err) {
      done(err, null);
    }
  }
}
