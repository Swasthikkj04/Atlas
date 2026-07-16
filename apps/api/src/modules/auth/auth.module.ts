import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';

import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret:
        process.env.JWT_ACCESS_SECRET ??
        'atlas-development-secret',
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    JwtStrategy,
  ],
  exports: [
    AuthService,
    PasswordService,
    JwtModule,
  ],
})
export class AuthModule {}