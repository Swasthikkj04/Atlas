import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { EmailModule } from '../../infrastructure/email/email.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { VerificationTokenService } from './services/verification-token.service';
import { PasswordResetTokenService } from './services/password-reset-token.service';
import { UserSessionService } from './services/user-session.service';
import { OAuthAccountService } from './services/oauth-account.service';
import { GoogleAuthService } from './services/google-auth.service';
import { GitHubAuthService } from './services/github-auth.service';
import { OAuthIdentityResolver } from './resolvers/oauth-identity.resolver';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';

@Module({
  imports: [
    UsersModule,
    EmailModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret:
          process.env.JWT_ACCESS_SECRET ?? 'atlas-development-access-secret',
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    VerificationTokenService,
    PasswordResetTokenService,
    UserSessionService,
    OAuthAccountService,
    OAuthIdentityResolver,
    GoogleAuthService,
    GitHubAuthService,
  ],
  exports: [
    AuthService,
    PasswordService,
    VerificationTokenService,
    PasswordResetTokenService,
    UserSessionService,
    OAuthAccountService,
    OAuthIdentityResolver,
    GoogleAuthService,
    GitHubAuthService,
  ],
})
export class AuthModule {}
