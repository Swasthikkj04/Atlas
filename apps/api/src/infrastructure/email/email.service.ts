import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_PROVIDER } from './providers/email-provider.interface';
import type { EmailProvider } from './providers/email-provider.interface';
import { buildVerificationEmailTemplate } from './templates/verification-email.template';
import { buildPasswordResetEmailTemplate } from './templates/password-reset-email.template';
import { buildPasswordResetConfirmationTemplate } from './templates/password-reset-confirmation.template';
import { buildAccountReactivationEmailTemplate } from './templates/account-reactivation-email.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider,
    private readonly configService: ConfigService,
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

  private getAppUrl(): string {
    return (
      this.configService.get<string>('APP_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173'
    );
  }

  async sendVerificationEmail(
    toEmail: string,
    rawVerificationToken: string,
    recipientName?: string,
  ): Promise<void> {
    const baseUrl = this.getAppUrl();
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${rawVerificationToken}`;

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
    const resetUrl = `${baseUrl}/auth/reset-password?token=${rawResetToken}`;

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
    const reactivationUrl = `${baseUrl}/auth/reactivate?token=${rawReactivationToken}`;

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
}
