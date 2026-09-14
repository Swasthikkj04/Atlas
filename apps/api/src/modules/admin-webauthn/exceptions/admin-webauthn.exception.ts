import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * ADMIN-003: Admin WebAuthn Exceptions
 *
 * Explicit error hierarchy enforcing fail-closed WebAuthn enrollment
 * and cryptographic validation rules.
 */

export class AdminWebAuthnChallengeExpiredException extends HttpException {
  constructor(message = 'WebAuthn registration challenge has expired.') {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: 'WEBAUTHN_CHALLENGE_EXPIRED',
        message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class AdminWebAuthnChallengeInvalidException extends HttpException {
  constructor(
    message = 'Invalid or already consumed WebAuthn registration challenge.',
  ) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: 'WEBAUTHN_CHALLENGE_INVALID',
        message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class AdminWebAuthnDuplicateCredentialException extends HttpException {
  constructor(
    message = 'This WebAuthn authenticator has already been registered.',
  ) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        errorCode: 'WEBAUTHN_DUPLICATE_CREDENTIAL',
        message,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class AdminWebAuthnVerificationFailedException extends HttpException {
  constructor(message = 'WebAuthn registration verification failed.') {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: 'WEBAUTHN_VERIFICATION_FAILED',
        message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class AdminWebAuthnLimitExceededException extends HttpException {
  constructor(message = 'Maximum allowed Admin passkeys reached.') {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        errorCode: 'WEBAUTHN_PASSKEY_LIMIT_EXCEEDED',
        message,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class AdminWebAuthnUnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized WebAuthn request.') {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: 'WEBAUTHN_UNAUTHORIZED',
        message,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class AdminWebAuthnAuthenticationFailedException extends HttpException {
  constructor(message = 'WebAuthn authentication verification failed.') {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: 'WEBAUTHN_AUTHENTICATION_FAILED',
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AdminWebAuthnAuthenticatorRejectedException extends HttpException {
  constructor(
    message = 'WebAuthn authenticator rejected due to counter anomaly or clone detection.',
  ) {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: 'WEBAUTHN_AUTHENTICATOR_REJECTED',
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
