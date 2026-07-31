import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleProfileMapper } from '../mappers/google-profile.mapper';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID:
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID.length > 0
          ? process.env.GOOGLE_CLIENT_ID
          : 'google-client-id-placeholder',
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_CLIENT_SECRET.length > 0
          ? process.env.GOOGLE_CLIENT_SECRET
          : 'google-client-secret-placeholder',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/api/v1/auth/google/callback',
      scope: ['openid', 'email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const normalizedProfile = GoogleProfileMapper.map(profile);
    done(null, normalizedProfile);
  }
}
