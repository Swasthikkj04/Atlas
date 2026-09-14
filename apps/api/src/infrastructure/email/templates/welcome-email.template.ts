export interface WelcomeEmailTemplateProps {
  recipientName?: string | null;
  appUrl: string;
}

export function extractFirstName(fullName?: string | null): string {
  if (!fullName || typeof fullName !== 'string') {
    return 'there';
  }
  const trimmed = fullName.trim();
  if (!trimmed) {
    return 'there';
  }
  const firstWord = trimmed.split(/\s+/)[0];
  return firstWord || 'there';
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildWelcomeEmailTemplate(props: WelcomeEmailTemplateProps): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientName, appUrl } = props;
  const firstName = extractFirstName(recipientName);
  const escapedFirstName = escapeHtml(firstName);
  const subject = 'A little welcome to Nebula';

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
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 36px 24px 36px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #f8fafc; line-height: 1.6;">
                Hi ${escapedFirstName},
              </p>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                I’m Swasthik, the developer behind Nebula.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                Just wanted to personally welcome you. I hope Nebula brings a little more clarity to the way you understand your infrastructure.
              </p>
              <p style="margin: 0 0 28px 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                Your Workspace is ready whenever you are.
              </p>

              <!-- CTA Button -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #f8fafc;">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; padding: 13px 28px; font-size: 14px; font-weight: 600; color: #090d16; text-decoration: none; border-radius: 8px; letter-spacing: -0.01em;">
                      Enter Nebula &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 28px 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                If you ever have feedback or need help, you can reach me at <a href="mailto:swasthik@argonion.com" style="color: #60a5fa; text-decoration: none;">swasthik@argonion.com</a>.
              </p>

              <!-- Sign-off -->
              <p style="margin: 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                Warmly,<br>
                <strong style="color: #f8fafc;">Swasthik K J</strong><br>
                <span style="color: #94a3b8; font-size: 13px;">Developer, Nebula</span>
              </p>

              <hr style="border: 0; border-top: 1px solid #1f2937; margin: 28px 0 20px 0;">

              <!-- Fallback URL -->
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                Button not working? Copy and paste this URL into your browser:
              </p>
              <p style="margin: 0; font-size: 12px; word-break: break-all; font-family: 'JetBrains Mono', Courier, monospace; color: #94a3b8;">
                <a href="${appUrl}" style="color: #60a5fa; text-decoration: none;">${appUrl}</a>
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

  const text = `Hi ${firstName},

I’m Swasthik, the developer behind Nebula.

Just wanted to personally welcome you. I hope Nebula brings a little more clarity to the way you understand your infrastructure.

Your Workspace is ready whenever you are.

[Enter Nebula]
${appUrl}

If you ever have feedback or need help, you can reach me at swasthik@argonion.com.

Warmly,
Swasthik K J
Developer, Nebula
`;

  return { subject, html, text };
}
