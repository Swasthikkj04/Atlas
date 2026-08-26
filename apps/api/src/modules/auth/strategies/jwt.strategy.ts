import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { UserAccountStatus } from '@prisma/client';

import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { extractAccessToken } from '../utils/auth-cookie.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    @Optional() private readonly configService?: ConfigService,
  ) {
    const isProduction =
      configService?.get<string>('NODE_ENV') === 'production' ||
      process.env.NODE_ENV === 'production';
    const secretOrKey =
      configService?.get<string>('JWT_ACCESS_SECRET') ||
      process.env.JWT_ACCESS_SECRET ||
      (isProduction ? '' : 'atlas-development-access-secret');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          return extractAccessToken(req) ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    sessionId?: string;
    sid?: string;
    iat?: number;
  }) {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.status !== UserAccountStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active.');
    }

    // AUTH-002 / AUTH-018 Security Rule: Session Revocation Enforcement
    // Reject tokens issued prior to tokenInvalidatedAt (e.g. after password reset)
    if (user.tokenInvalidatedAt && payload.iat) {
      const tokenIssuedAtSec = payload.iat;
      const invalidationTimeSec = Math.floor(
        new Date(user.tokenInvalidatedAt).getTime() / 1000,
      );

      if (tokenIssuedAtSec < invalidationTimeSec) {
        throw new UnauthorizedException(
          'Session has been revoked due to a password reset. Please log in again.',
        );
      }
    }

    // AUTH-018 Security Rule: Stateful session validation if sessionId is present
    const sessionId = payload.sessionId || payload.sid;
    if (sessionId) {
      const session = await this.prisma.userSession.findUnique({
        where: { id: sessionId },
      });

      if (
        !session ||
        session.revokedAt !== null ||
        session.userId !== user.id ||
        new Date() > session.expiresAt
      ) {
        throw new UnauthorizedException(
          'Session has been revoked or expired. Please log in again.',
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
