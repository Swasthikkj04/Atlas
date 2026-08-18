export interface SendEmailPayload {
  to: string;
  from: string; // e.g. "Nebula <no-reply@argonion.com>"
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProvider {
  send(payload: SendEmailPayload): Promise<void>;
}

export const EMAIL_PROVIDER = 'EMAIL_PROVIDER';
