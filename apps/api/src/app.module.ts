import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import authConfig from './config/auth.config';

import { PrismaModule } from './infrastructure/prisma/prisma.module';

import { AuthModule } from './modules/auth/auth.module';
import { DomainsModule } from './modules/domains/domains.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { UnderstandingModule } from './modules/understanding/understanding.module';
import { DiscoveryModule } from './infrastructure/discovery/discovery.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
    }),

    PrismaModule,

    UsersModule,
    AuthModule,
    DomainsModule,
    HealthModule,
    UnderstandingModule,
    DiscoveryModule
  ],
})
export class AppModule {}