import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { AccountReactivationTokenService } from './services/account-reactivation-token.service';
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
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
        return {
          secret:
            configService.get<string>('JWT_ACCESS_SECRET') ||
            (isProduction ? undefined : 'atlas-development-access-secret'),
          signOptions: {
            expiresIn: (configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
              '15m') as any,
          },
        };
      },
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
    AccountReactivationTokenService,
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
    AccountReactivationTokenService,
    UserSessionService,
    OAuthAccountService,
    OAuthIdentityResolver,
    GoogleAuthService,
    GitHubAuthService,
  ],
})
export class AuthModule {}
