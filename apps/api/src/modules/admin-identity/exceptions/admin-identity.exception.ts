import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * ADMIN-001: Admin Identity Exceptions
 *
 * Explicit error hierarchy enforcing fail-closed security invariants
 * for the owner-exclusive Admin identity boundary.
 */

export class AdminAlreadyProvisionedException extends HttpException {
  constructor(
    message = 'Platform supports exactly one owner-exclusive Admin identity. An Admin identity is already provisioned.',
  ) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        errorCode: 'ADMIN_ALREADY_PROVISIONED',
        message,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class AdminNotProvisionedException extends HttpException {
  constructor(
    message = 'No authorized Admin identity has been provisioned on this platform.',
  ) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: 'ADMIN_NOT_PROVISIONED',
        message,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class AdminDisabledException extends HttpException {
  constructor(
    message = 'Admin identity is disabled and cannot authenticate or perform administrative actions.',
  ) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: 'ADMIN_IDENTITY_DISABLED',
        message,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class AdminPrivilegeEscalationException extends HttpException {
  constructor(
    message = 'Attempted unauthorized Admin privilege escalation. Normal identities cannot acquire Admin authority.',
  ) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: 'ADMIN_PRIVILEGE_ESCALATION_REJECTED',
        message,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class AdminInvariantViolationException extends HttpException {
  constructor(
    message = 'Owner-exclusive Admin identity invariant violation detected.',
  ) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: 'ADMIN_INVARIANT_VIOLATION',
        message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
