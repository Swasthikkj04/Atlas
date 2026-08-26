export type OAuthErrorCode =
  | 'github_email_unverified'
  | 'account_deactivated'
  | 'oauth_denied'
  | 'oauth_invalid_request'
  | 'oauth_provider_error'
  | 'oauth_authentication_failed'
  | 'oauth_session_failed';

export interface OAuthErrorDetails {
  title: string;
  body: string;
  instruction?: string;
  iconType: 'unverified_email' | 'account_deactivated' | 'denied' | 'error';
  primaryAction?: { label: string; href: string; actionType: 'retry_github' | 'retry_login' | 'navigate' };
  secondaryAction?: { label: string; href: string };
}

export function mapOAuthError(
  errorCode: string | null,
  email?: string | null,
): OAuthErrorDetails {
  switch (errorCode) {
    case 'account_deactivated':
      return {
        title: 'Account deactivated',
        body: 'Your Nebula account is currently deactivated. Your infrastructure history and workspace data are preserved.',
        instruction: "We'll send a secure reactivation link to your account email.",
        iconType: 'account_deactivated',
        primaryAction: {
          label: 'Reactivate your account',
          href: email ? `/auth/reactivate?email=${encodeURIComponent(email)}` : '/auth/reactivate',
          actionType: 'navigate',
        },
        secondaryAction: {
          label: 'Return to Sign In',
          href: '/login',
        },
      };

    case 'github_email_unverified':
      return {
        title: 'Verify your GitHub email',
        body: 'Nebula needs a verified email address to complete GitHub sign-in.',
        instruction:
          'Verify your email address in GitHub, then return here and try signing in again.',
        iconType: 'unverified_email',
        primaryAction: {
          label: 'Try GitHub Again',
          href: '/api/v1/auth/github',
          actionType: 'retry_github',
        },
        secondaryAction: {
          label: 'Return to Sign In',
          href: '/login',
        },
      };

    case 'oauth_denied':
      return {
        title: 'GitHub sign-in cancelled',
        body: 'No changes were made to your Nebula account.',
        instruction: "You can try signing in again whenever you're ready.",
        iconType: 'denied',
        primaryAction: {
          label: 'Return to Sign In',
          href: '/login',
          actionType: 'navigate',
        },
      };

    case 'oauth_invalid_request':
      return {
        title: "We couldn't complete sign-in",
        body: 'The authentication request was invalid or has expired. Please try again.',
        instruction: 'Please return to sign in and initiate authentication again.',
        iconType: 'error',
        primaryAction: {
          label: 'Try Again',
          href: '/login',
          actionType: 'retry_login',
        },
        secondaryAction: {
          label: 'Return to Sign In',
          href: '/login',
        },
      };

    case 'oauth_provider_error':
    case 'oauth_session_failed':
    case 'oauth_authentication_failed':
    default:
      return {
        title: "We couldn't complete sign-in",
        body: 'Something prevented Nebula from completing authentication. Please try again.',
        instruction:
          'If the problem continues, try signing in with another method or return to the sign-in page.',
        iconType: 'error',
        primaryAction: {
          label: 'Try Again',
          href: '/login',
          actionType: 'retry_login',
        },
        secondaryAction: {
          label: 'Return to Sign In',
          href: '/login',
        },
      };
  }
}
