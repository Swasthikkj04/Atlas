import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationEmail(
    toEmail: string,
    rawVerificationToken: string,
  ): Promise<void> {
    const baseUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:5173';
    const verificationUrl = `${baseUrl}/verify-email?token=${rawVerificationToken}`;

    this.logger.log(
      `[Email Service] Verification email dispatched to ${toEmail}. Verification URL: ${verificationUrl}`,
    );
  }

  async sendPasswordResetEmail(
    toEmail: string,
    rawResetToken: string,
  ): Promise<void> {
    const baseUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:5173';
    const resetUrl = `${baseUrl}/reset-password?token=${rawResetToken}`;

    this.logger.log(
      `[Email Service] Password reset instructions dispatched to ${toEmail}. Reset URL: ${resetUrl}`,
    );
  }

  async sendPasswordResetConfirmationEmail(toEmail: string): Promise<void> {
    this.logger.log(
      `[Email Service] Password reset confirmation security notice sent to ${toEmail}.`,
    );
  }
}
