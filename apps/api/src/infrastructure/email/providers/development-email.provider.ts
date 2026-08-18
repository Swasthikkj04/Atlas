import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailProvider, SendEmailPayload } from './email-provider.interface';

@Injectable()
export class DevelopmentEmailProvider implements EmailProvider {
  private readonly logger = new Logger(DevelopmentEmailProvider.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST') || 'localhost';
    const port = Number(this.configService.get<number>('SMTP_PORT')) || 1025;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      ignoreTLS: true,
    });
  }

  async send(payload: SendEmailPayload): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: payload.from,
        to: payload.to,
        replyTo: payload.replyTo,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      this.logger.log(
        `[Email Captured] Dispatched "${payload.subject}" to ${payload.to}. Captured by local Mailpit transport.`,
      );
    } catch (error: any) {
      this.logger.error(
        `[Email Error] Failed to dispatch email to ${payload.to}: ${error?.message || error}`,
      );
      throw error;
    }
  }
}
