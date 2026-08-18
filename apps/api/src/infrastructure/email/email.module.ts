import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EMAIL_PROVIDER } from './providers/email-provider.interface';
import { DevelopmentEmailProvider } from './providers/development-email.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    EmailService,
    DevelopmentEmailProvider,
    {
      provide: EMAIL_PROVIDER,
      useFactory: (
        configService: ConfigService,
        devProvider: DevelopmentEmailProvider,
      ) => {
        const providerType =
          configService.get<string>('EMAIL_PROVIDER') || 'development';
        switch (providerType.toLowerCase()) {
          case 'development':
          default:
            return devProvider;
        }
      },
      inject: [ConfigService, DevelopmentEmailProvider],
    },
  ],
  exports: [EmailService, EMAIL_PROVIDER],
})
export class EmailModule {}
