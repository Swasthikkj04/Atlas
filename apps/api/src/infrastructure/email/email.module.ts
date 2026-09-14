import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from './email.service';
import { EMAIL_PROVIDER } from './providers/email-provider.interface';
import { DevelopmentEmailProvider } from './providers/development-email.provider';
import { ResendEmailProvider } from './providers/resend-email.provider';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    EmailService,
    DevelopmentEmailProvider,
    ResendEmailProvider,
    {
      provide: EMAIL_PROVIDER,
      useFactory: (
        configService: ConfigService,
        devProvider: DevelopmentEmailProvider,
        resendProvider: ResendEmailProvider,
      ) => {
        const providerType =
          configService.get<string>('EMAIL_PROVIDER') || 'development';
        switch (providerType.toLowerCase()) {
          case 'resend':
            return resendProvider;
          case 'development':
          default:
            return devProvider;
        }
      },
      inject: [ConfigService, DevelopmentEmailProvider, ResendEmailProvider],
    },
  ],
  exports: [EmailService, EMAIL_PROVIDER],
})
export class EmailModule {}
