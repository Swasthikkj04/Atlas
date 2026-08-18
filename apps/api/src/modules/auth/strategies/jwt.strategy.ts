import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

import { UsersService } from '../../users/users.service';
import { extractAccessToken } from '../utils/auth-cookie.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          return extractAccessToken(req) ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_ACCESS_SECRET ?? 'atlas-development-access-secret',
    });
  }

  async validate(payload: { sub: string; email: string; iat?: number }) {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    // AUTH-002 Security Rule: Session Revocation Enforcement
    // Reject tokens issued prior to tokenInvalidatedAt (e.g. after password reset)
    if (user.tokenInvalidatedAt && payload.iat) {
      const tokenIssuedAtMs = payload.iat * 1000;
      const invalidationTimeMs = new Date(user.tokenInvalidatedAt).getTime();

      if (tokenIssuedAtMs < invalidationTimeMs) {
        throw new UnauthorizedException(
          'Session has been revoked due to a password reset. Please log in again.',
        );
      }
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    };
  }
}
