import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleProfileMapper } from '../mappers/google-profile.mapper';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(@Optional() private readonly configService?: ConfigService) {
    const isProduction =
      configService?.get<string>('NODE_ENV') === 'production' ||
      process.env.NODE_ENV === 'production';
    const clientID =
      configService?.get<string>('GOOGLE_CLIENT_ID') ||
      process.env.GOOGLE_CLIENT_ID ||
      (isProduction ? '' : 'google-client-id-placeholder');
    const clientSecret =
      configService?.get<string>('GOOGLE_CLIENT_SECRET') ||
      process.env.GOOGLE_CLIENT_SECRET ||
      (isProduction ? '' : 'google-client-secret-placeholder');
    const callbackURL =
      configService?.get<string>('GOOGLE_CALLBACK_URL') ||
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/api/v1/auth/google/callback';

    super({
      clientID,
      clientSecret,
      callbackURL,
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
