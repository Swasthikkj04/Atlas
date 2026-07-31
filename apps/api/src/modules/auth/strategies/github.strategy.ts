import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { GitHubProfileMapper } from '../mappers/github-profile.mapper';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID:
        process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID.length > 0
          ? process.env.GITHUB_CLIENT_ID
          : 'github-client-id-placeholder',
      clientSecret:
        process.env.GITHUB_CLIENT_SECRET &&
        process.env.GITHUB_CLIENT_SECRET.length > 0
          ? process.env.GITHUB_CLIENT_SECRET
          : 'github-client-secret-placeholder',
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ||
        'http://localhost:3000/api/v1/auth/github/callback',
      scope: ['read:user', 'user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ): Promise<any> {
    const normalizedProfile = GitHubProfileMapper.map(profile);
    done(null, normalizedProfile);
  }
}
