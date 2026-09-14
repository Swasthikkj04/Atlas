import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EMAIL_PROVIDER } from './providers/email-provider.interface';
import type { EmailProvider } from './providers/email-provider.interface';
import { buildVerificationEmailTemplate } from './templates/verification-email.template';
import { buildPasswordResetEmailTemplate } from './templates/password-reset-email.template';
import { buildPasswordResetConfirmationTemplate } from './templates/password-reset-confirmation.template';
import { buildAccountReactivationEmailTemplate } from './templates/account-reactivation-email.template';
import { buildWelcomeEmailTemplate } from './templates/welcome-email.template';

export interface WelcomeEmailResult {
  status: 'SENT' | 'ALREADY_SENT' | 'FAILED' | 'SKIPPED';
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider,
    private readonly configService: ConfigService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  private getSender(): string {
    const fromAddress =
      this.configService.get<string>('EMAIL_FROM') || 'no-reply@argonion.com';
    const appName = this.configService.get<string>('APP_NAME') || 'Nebula';
    return `${appName} <${fromAddress}>`;
  }

  private getReplyTo(): string | undefined {
    return this.configService.get<string>('REPLY_TO_EMAIL') || undefined;
  }

  private getWelcomeSender(): string {
    const fromName =
      this.configService.get<string>('EMAIL_FROM_NAME') || 'Swasthik K J';
    const fromAddress =
      this.configService.get<string>('EMAIL_FROM_ADDRESS') ||
      'swasthik@argonion.com';
    return `${fromName} <${fromAddress}>`;
  }

  private getWelcomeReplyTo(): string {
    return (
      this.configService.get<string>('EMAIL_REPLY_TO') || 'support@argonion.com'
    );
  }

  private getAppUrl(): string {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production' ||
      (!this.configService.get<string>('NODE_ENV') &&
        process.env.NODE_ENV === 'production');

    const configServiceUrl =
      this.configService.get<string>('NEBULA_APP_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('APP_URL');

    if (configServiceUrl && configServiceUrl.trim() !== '') {
      return configServiceUrl.trim().replace(/\/+$/, '');
    }

    if (!isProduction) {
      const processEnvUrl =
        process.env.NEBULA_APP_URL ||
        process.env.FRONTEND_URL ||
        process.env.APP_URL;
      if (processEnvUrl && processEnvUrl.trim() !== '') {
        return processEnvUrl.trim().replace(/\/+$/, '');
      }
    }

    return isProduction
      ? 'https://nebula.argonion.com'
      : 'http://localhost:5173';
  }

  async sendVerificationEmail(
    toEmail: string,
    rawVerificationToken: string,
    recipientName?: string,
  ): Promise<void> {
    const baseUrl = this.getAppUrl();
    const verificationUrl = `${baseUrl}/verify-email?token=${rawVerificationToken}`;

    const { subject, html, text } = buildVerificationEmailTemplate({
      recipientName,
      verificationUrl,
      expiryHours: 24,
    });

    try {
      await this.emailProvider.send({
        to: toEmail,
        from: this.getSender(),
        replyTo: this.getReplyTo(),
        subject,
        html,
        text,
      });

      this.logger.log(`Verification email dispatched to ${toEmail}.`);
    } catch (error: any) {
      this.logger.error(
        `Failed to deliver verification email to ${toEmail}: ${error?.message || error}`,
      );
    }
  }

  async sendPasswordResetEmail(
    toEmail: string,
    rawResetToken: string,
    recipientName?: string,
  ): Promise<void> {
    const baseUrl = this.getAppUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${rawResetToken}`;

    const { subject, html, text } = buildPasswordResetEmailTemplate({
      recipientName,
      resetUrl,
      expiryHours: 1,
    });

    try {
      await this.emailProvider.send({
        to: toEmail,
        from: this.getSender(),
        replyTo: this.getReplyTo(),
        subject,
        html,
        text,
      });

      this.logger.log(`Password reset email dispatched to ${toEmail}.`);
    } catch (error: any) {
      this.logger.error(
        `Failed to deliver password reset email to ${toEmail}: ${error?.message || error}`,
      );
    }
  }

  async sendPasswordResetConfirmationEmail(
    toEmail: string,
    recipientName?: string,
  ): Promise<void> {
    const { subject, html, text } = buildPasswordResetConfirmationTemplate({
      recipientName,
      timestamp: new Date().toUTCString(),
    });

    try {
      await this.emailProvider.send({
        to: toEmail,
        from: this.getSender(),
        replyTo: this.getReplyTo(),
        subject,
        html,
        text,
      });

      this.logger.log(
        `Password reset confirmation notice dispatched to ${toEmail}.`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to deliver password reset confirmation to ${toEmail}: ${error?.message || error}`,
      );
    }
  }

  async sendAccountReactivationEmail(
    toEmail: string,
    rawReactivationToken: string,
    recipientName?: string,
  ): Promise<void> {
    const baseUrl = this.getAppUrl();
    const reactivationUrl = `${baseUrl}/reactivate?token=${rawReactivationToken}`;

    const { subject, html, text } = buildAccountReactivationEmailTemplate({
      recipientName,
      reactivationUrl,
      expiryMinutes: 15,
    });

    try {
      await this.emailProvider.send({
        to: toEmail,
        from: this.getSender(),
        replyTo: this.getReplyTo(),
        subject,
        html,
        text,
      });

      this.logger.log(`Account reactivation email dispatched to ${toEmail}.`);
    } catch (error: any) {
      this.logger.error(
        `Failed to deliver account reactivation email to ${toEmail}: ${error?.message || error}`,
      );
    }
  }

  async sendWelcomeEmail(
    userId: string,
    toEmail: string,
    recipientName?: string | null,
  ): Promise<WelcomeEmailResult> {
    if (
      !userId ||
      !toEmail ||
      typeof toEmail !== 'string' ||
      !toEmail.includes('@')
    ) {
      this.logger.warn(
        `[WelcomeEmail] Skipped: invalid recipient or userId (userId=${userId}, email=${toEmail})`,
      );
      return { status: 'SKIPPED', error: 'Invalid recipient email or userId' };
    }

    const idempotencyKey = `welcome-email:${userId}`;
    const normalizedEmail = toEmail.trim().toLowerCase();

    // 1. Check idempotency record if prisma is available
    if (this.prisma) {
      try {
        const existing = await this.prisma.emailDeliveryRecord.findUnique({
          where: { idempotencyKey },
        });

        if (existing && existing.status === 'SENT') {
          this.logger.log(
            `[WelcomeEmail] Skipped - already sent for userId=${userId}`,
          );
          return { status: 'ALREADY_SENT' };
        }

        if (!existing) {
          await this.prisma.emailDeliveryRecord
            .create({
              data: {
                userId,
                idempotencyKey,
                emailType: 'WELCOME_EMAIL',
                recipientEmail: normalizedEmail,
                status: 'PENDING',
                attemptCount: 0,
              },
            })
            .catch((createErr) => {
              this.logger.debug(
                `[WelcomeEmail] Record creation race handled: ${createErr?.message}`,
              );
            });
        }

        await this.prisma.emailDeliveryRecord.updateMany({
          where: { idempotencyKey },
          data: {
            status: 'ATTEMPTED',
            attemptCount: { increment: 1 },
            lastAttemptAt: new Date(),
          },
        });
      } catch (dbErr: any) {
        this.logger.warn(
          `[WelcomeEmail] DB delivery tracking warning (proceeding with send): ${dbErr?.message}`,
        );
      }
    }

    // 2. Build email template
    const appUrl = this.getAppUrl();
    const { subject, html, text } = buildWelcomeEmailTemplate({
      recipientName,
      appUrl,
    });

    // 3. Dispatch email via provider
    try {
      await this.emailProvider.send({
        to: normalizedEmail,
        from: this.getWelcomeSender(),
        replyTo: this.getWelcomeReplyTo(),
        subject,
        html,
        text,
      });

      if (this.prisma) {
        await this.prisma.emailDeliveryRecord
          .updateMany({
            where: { idempotencyKey },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              errorMessage: null,
            },
          })
          .catch(() => null);
      }

      this.logger.log(
        `[WelcomeEmail] Welcome email dispatched successfully to ${normalizedEmail} (userId=${userId}).`,
      );
      return { status: 'SENT' };
    } catch (error: any) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : String(error || 'Unknown email error');
      this.logger.error(
        `[WelcomeEmail] Failed to deliver welcome email to ${normalizedEmail} (userId=${userId}): ${errorMsg}`,
      );

      if (this.prisma) {
        await this.prisma.emailDeliveryRecord
          .updateMany({
            where: { idempotencyKey },
            data: {
              status: 'FAILED',
              errorMessage: errorMsg,
            },
          })
          .catch(() => null);
      }

      return { status: 'FAILED', error: errorMsg };
    }
  }
}
