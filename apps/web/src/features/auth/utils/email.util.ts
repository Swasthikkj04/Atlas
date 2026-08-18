/**
 * Email utility functions for auth presentation and privacy.
 */

/**
 * Masks an email address for privacy in user-facing verification prompts.
 * Example: "swasthik.gowda@gmail.com" -> "s*****a@gmail.com"
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return email || '';
  }

  const [local, domain] = email.split('@');
  if (!local || !domain) return email;

  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }

  const maskLen = Math.min(5, Math.max(3, local.length - 2));
  return `${local[0]}${'*'.repeat(maskLen)}${local[local.length - 1]}@${domain}`;
}
