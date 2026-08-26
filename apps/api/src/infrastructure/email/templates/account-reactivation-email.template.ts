export interface AccountReactivationEmailTemplateProps {
  recipientName?: string;
  reactivationUrl: string;
  expiryMinutes?: number;
}

export function buildAccountReactivationEmailTemplate(
  props: AccountReactivationEmailTemplateProps,
): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientName, reactivationUrl, expiryMinutes = 15 } = props;
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';
  const subject = 'Reactivate your Nebula account';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; line-height: 1.6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px 36px; border-bottom: 1px solid #1f2937;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #f8fafc;">Nebula</span>
                    <span style="font-size: 12px; color: #94a3b8; margin-left: 8px; font-family: 'JetBrains Mono', Courier, monospace;">ACCOUNT RECOVERY</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 36px 24px 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #f8fafc; letter-spacing: -0.02em;">
                Reactivate your account
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #94a3b8; line-height: 1.6;">
                ${greeting}
              </p>
              <p style="margin: 0 0 28px 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                Your Nebula account is currently deactivated. If you requested to restore your account access, use the secure link below:
              </p>

              <!-- CTA Button -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #f8fafc;">
                    <a href="${reactivationUrl}" target="_blank" style="display: inline-block; padding: 13px 28px; font-size: 14px; font-weight: 600; color: #090d16; text-decoration: none; border-radius: 8px; letter-spacing: -0.01em;">
                      Reactivate my account &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice -->
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                This link expires in ${expiryMinutes} minutes and can only be used once. If you did not request this reactivation, you can safely ignore this email.
              </p>

              <hr style="border: 0; border-top: 1px solid #1f2937; margin: 28px 0 20px 0;">

              <!-- Fallback URL -->
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                Button not working? Copy and paste this URL into your browser:
              </p>
              <p style="margin: 0; font-size: 12px; word-break: break-all; font-family: 'JetBrains Mono', Courier, monospace; color: #94a3b8;">
                <a href="${reactivationUrl}" style="color: #60a5fa; text-decoration: none;">${reactivationUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 28px 36px; background-color: #0d1322; border-top: 1px solid #1f2937;">
              <p style="margin: 0; font-size: 12px; color: #475569; text-align: center;">
                &copy; ${new Date().getFullYear()} Nebula &bull; Argonion Inc. Infrastructure Understanding System.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${subject}

${greeting}

Your Nebula account is currently deactivated. If you requested reactivation, use the secure link below:

${reactivationUrl}

This link expires in ${expiryMinutes} minutes and can only be used once.

If you did not request this, you can safely ignore this email.

--
Nebula | Argonion Inc.
`;

  return { subject, html, text };
}
