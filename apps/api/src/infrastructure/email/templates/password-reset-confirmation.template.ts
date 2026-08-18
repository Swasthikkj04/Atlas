export interface PasswordResetConfirmationTemplateProps {
  recipientName?: string;
  timestamp?: string;
}

export function buildPasswordResetConfirmationTemplate(
  props: PasswordResetConfirmationTemplateProps,
): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientName, timestamp = new Date().toUTCString() } = props;
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';
  const subject = 'Your Nebula password was changed';

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
                    <span style="font-size: 12px; color: #94a3b8; margin-left: 8px; font-family: 'JetBrains Mono', Courier, monospace;">SECURITY ALERT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 36px 24px 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #f8fafc; letter-spacing: -0.02em;">
                Password successfully updated
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #94a3b8; line-height: 1.6;">
                ${greeting}
              </p>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                The password for your Nebula account was successfully changed on <strong>${timestamp}</strong>.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                For your security, all active sessions on other devices have been automatically revoked.
              </p>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #ef4444; line-height: 1.5;">
                If you did NOT make this change, please contact your security administrator or reset your password immediately.
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

The password for your Nebula account was successfully changed on ${timestamp}.

For your security, all active sessions on other devices have been automatically revoked.

If you did not make this change, please reset your password immediately.

--
Nebula | Argonion Inc.
`;

  return { subject, html, text };
}
