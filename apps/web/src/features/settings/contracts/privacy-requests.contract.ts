/**
 * Authoritative Data Subject Rights & Privacy Requests Contract (LEGAL-003 / AX-109).
 *
 * Grounded in Section 11 ("Privacy Rights and Requests") & Section 10 ("Account Lifecycle")
 * of the Nebula Privacy Policy and Terms & Conditions.
 */

export type PrivacyRequestType =
  | 'DATA_ACCESS'
  | 'DATA_RECTIFICATION'
  | 'PROCESSING_RESTRICTION'
  | 'DELETION_ASSISTANCE'
  | 'GENERAL_PRIVACY_INQUIRY';

export interface PrivacyRequestOption {
  readonly type: PrivacyRequestType;
  readonly label: string;
  readonly description: string;
}

export const PRIVACY_REQUEST_OPTIONS: readonly PrivacyRequestOption[] = [
  {
    type: 'DATA_ACCESS',
    label: 'Data Access & Export Request',
    description: 'Request an official export of personal data, saved domains, and infrastructure snapshot metadata.',
  },
  {
    type: 'DATA_RECTIFICATION',
    label: 'Data Rectification Request',
    description: 'Request correction or update of inaccurate account or identity records.',
  },
  {
    type: 'PROCESSING_RESTRICTION',
    label: 'Processing Restriction / Objection',
    description: 'Request limitations on specific processing activities or object to certain infrastructure telemetry.',
  },
  {
    type: 'DELETION_ASSISTANCE',
    label: 'Assisted Deletion & Backup Purge Inquiry',
    description: 'Inquire about enterprise-level data removal or custom historical purge requirements.',
  },
  {
    type: 'GENERAL_PRIVACY_INQUIRY',
    label: 'General Privacy & Legal Inquiry',
    description: 'Ask questions regarding Argonion data handling, hosting regions, or regulatory compliance.',
  },
] as const;

export interface SubmitPrivacyRequestPayload {
  readonly requestType: PrivacyRequestType;
  readonly subject: string;
  readonly details: string;
  readonly userEmail: string;
  readonly userId: string;
}

export interface PrivacyRequestSubmissionResult {
  readonly success: boolean;
  readonly referenceId: string;
  readonly message: string;
  readonly contactEmail: string;
}

/**
 * Validates a privacy request submission payload.
 */
export function validatePrivacyRequest(payload: {
  requestType?: PrivacyRequestType;
  subject?: string;
  details?: string;
}): { isValid: boolean; error?: string } {
  if (!payload.requestType) {
    return { isValid: false, error: 'Please select a request type.' };
  }
  if (!payload.subject || payload.subject.trim().length < 3) {
    return { isValid: false, error: 'Subject must be at least 3 characters.' };
  }
  if (!payload.details || payload.details.trim().length < 10) {
    return { isValid: false, error: 'Please provide at least 10 characters describing your request.' };
  }
  return { isValid: true };
}

/**
 * Formats a structured mailto fallback URL for direct privacy inquiries.
 */
export function generatePrivacyMailtoUrl(payload: SubmitPrivacyRequestPayload): string {
  const email = 'privacy@argonion.com';
  const subject = encodeURIComponent(`[Privacy Request: ${payload.requestType}] ${payload.subject}`);
  const body = encodeURIComponent(
    `User ID: ${payload.userId}\n` +
    `Registered Email: ${payload.userEmail}\n` +
    `Request Type: ${payload.requestType}\n\n` +
    `Details / Request Description:\n${payload.details}\n\n` +
    `Sent from Nebula Account Settings (Data Subject Rights Surface)`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
