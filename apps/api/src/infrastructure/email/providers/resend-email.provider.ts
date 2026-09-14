import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailProvider, SendEmailPayload } from './email-provider.interface';

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);
  private resendClient: Resend | null = null;

  constructor(
    private readonly configService: ConfigService,
    @Optional() resendClient?: Resend,
  ) {
    if (resendClient) {
      this.resendClient = resendClient;
    } else {
      const apiKey = this.configService.get<string>('RESEND_API_KEY');
      if (apiKey && apiKey.trim() !== '') {
        this.resendClient = new Resend(apiKey.trim());
      }
    }
  }

  private getClient(): Resend {
    if (!this.resendClient) {
      const apiKey = this.configService.get<string>('RESEND_API_KEY');
      if (!apiKey || apiKey.trim() === '') {
        const msg =
          '[Resend Error] Cannot send email: RESEND_API_KEY is not configured (provider=resend, event=email_send_failed).';
        this.logger.error(msg);
        throw new Error('Resend API key is not configured.');
      }
      this.resendClient = new Resend(apiKey.trim());
    }
    return this.resendClient;
  }

  async send(payload: SendEmailPayload): Promise<void> {
    const recipientDomain = this.extractRecipientDomain(payload.to);
    const client = this.getClient();

    const sendOptions: Parameters<typeof client.emails.send>[0] = {
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      ...(payload.replyTo && payload.replyTo.trim() !== ''
        ? { replyTo: payload.replyTo.trim() }
        : {}),
    };

    let result;
    try {
      result = await client.emails.send(sendOptions);
    } catch (error: unknown) {
      const errorCategory = this.classifyException(error);
      const errMessage =
        error instanceof Error
          ? error.message
          : String(error || 'Unknown error');
      const safeErrMsg = this.sanitizeMessage(errMessage);
      this.logger.error(
        `[Resend Error] Transport failure sending email (provider=resend, event=email_send_failed, recipientDomain=${recipientDomain}, errorCategory=${errorCategory}): ${safeErrMsg}`,
      );
      throw error;
    }

    if (result.error) {
      const errorCategory = this.classifyError(
        result.error.name,
        result.error.statusCode,
      );
      const safeErrorMsg = this.sanitizeMessage(
        result.error.message || 'Unknown provider error',
      );
      this.logger.error(
        `[Resend Error] Failed to send email (provider=resend, event=email_send_failed, recipientDomain=${recipientDomain}, errorCategory=${errorCategory}, statusCode=${result.error.statusCode}): ${safeErrorMsg}`,
      );
      throw new Error(safeErrorMsg);
    }

    this.logger.log(
      `[Resend Email Dispatched] Dispatched "${payload.subject}" (provider=resend, recipientDomain=${recipientDomain}, messageId=${result.data?.id || 'unknown'}).`,
    );
  }

  private extractRecipientDomain(to: string): string {
    if (!to || typeof to !== 'string') return 'unknown';
    const match = to.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
    const parts = to.split('@');
    return parts.length > 1
      ? parts[parts.length - 1].replace(/[>\]\s]/g, '').toLowerCase()
      : 'unknown';
  }

  private classifyError(
    errorName?: string,
    statusCode?: number | null,
  ): string {
    if (!errorName && !statusCode) return 'unknown_error';

    const name = (errorName || '').toLowerCase();

    if (
      name.includes('api_key') ||
      name.includes('restricted_api_key') ||
      name.includes('invalid_api_key') ||
      name.includes('missing_api_key') ||
      name.includes('invalid_access') ||
      statusCode === 401 ||
      statusCode === 403
    ) {
      return 'authentication_error';
    }

    if (
      name.includes('rate_limit') ||
      name.includes('quota') ||
      statusCode === 429
    ) {
      return 'rate_limit';
    }

    if (
      name.includes('validation') ||
      name.includes('invalid_parameter') ||
      name.includes('missing_required_field') ||
      name.includes('invalid_from_address') ||
      name.includes('invalid_attachment') ||
      statusCode === 400 ||
      statusCode === 422
    ) {
      return 'validation_error';
    }

    if (
      name.includes('internal_server_error') ||
      name.includes('application_error') ||
      (statusCode !== null && statusCode !== undefined && statusCode >= 500)
    ) {
      return 'server_error';
    }

    return 'provider_error';
  }

  private classifyException(err: unknown): string {
    const message = (
      err instanceof Error ? err.message : String(err || '')
    ).toLowerCase();
    const code =
      err &&
      typeof err === 'object' &&
      'code' in err &&
      typeof err.code === 'string'
        ? (err as { code: string }).code.toLowerCase()
        : '';
    if (
      message.includes('fetch failed') ||
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('etimedout') ||
      code === 'econnrefused' ||
      code === 'etimedout' ||
      code === 'enotfound' ||
      code === 'econnreset'
    ) {
      return 'network_error';
    }
    return 'unknown_error';
  }

  private sanitizeMessage(msg: string): string {
    if (!msg || typeof msg !== 'string') return '';
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey && apiKey.length > 5 && msg.includes(apiKey)) {
      return msg.split(apiKey).join('[REDACTED]');
    }
    return msg;
  }
}
