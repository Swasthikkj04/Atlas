import { HttpException, HttpStatus } from '@nestjs/common';
import { AdminCredentialFailureCategory } from '../contracts/admin-credential.contract';

/**
 * ADMIN-002: Admin Credential Exceptions
 *
 * Explicit error hierarchy enforcing fail-closed credential verification
 * and anti-abuse policies.
 */

export class AdminCredentialNotFoundException extends HttpException {
  constructor(message = 'Admin credential not found.') {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: 'ADMIN_CREDENTIAL_NOT_FOUND',
        message,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class AdminCredentialInvalidException extends HttpException {
  constructor(message = 'Invalid Admin credentials.') {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: AdminCredentialFailureCategory.INVALID_CREDENTIALS,
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AdminCredentialLockedException extends HttpException {
  constructor(
    public readonly lockedUntil?: Date | null,
    message = 'Admin credential has been temporarily locked due to excessive failed attempts.',
  ) {
    super(
      {
        statusCode: HttpStatus.LOCKED,
        errorCode: AdminCredentialFailureCategory.CREDENTIAL_LOCKED,
        message,
        lockedUntil: lockedUntil ? lockedUntil.toISOString() : undefined,
      },
      HttpStatus.LOCKED,
    );
  }
}

export class AdminCredentialDisabledException extends HttpException {
  constructor(
    message = 'Admin credential is disabled and cannot participate in authentication.',
  ) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: AdminCredentialFailureCategory.CREDENTIAL_DISABLED,
        message,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class AdminCredentialRevokedException extends HttpException {
  constructor(
    message = 'Admin credential has been permanently revoked and cannot be reused.',
  ) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: AdminCredentialFailureCategory.CREDENTIAL_REVOKED,
        message,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class AdminCredentialRateLimitException extends HttpException {
  constructor(
    message = 'Too many Admin credential verification attempts. Please retry later.',
  ) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        errorCode: AdminCredentialFailureCategory.RATE_LIMIT_EXCEEDED,
        message,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class AdminCredentialPolicyViolationException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        errorCode: 'ADMIN_CREDENTIAL_POLICY_VIOLATION',
        message,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class AdminCredentialEscalationException extends HttpException {
  constructor(
    message = 'Attempted unauthorized credential promotion or reassignment between security boundaries.',
  ) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: 'ADMIN_CREDENTIAL_ESCALATION_REJECTED',
        message,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
