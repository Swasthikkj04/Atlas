import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * ADMIN-005: Admin Session & JWT Exceptions
 *
 * Explicit error hierarchy enforcing fail-closed Admin session evaluation
 * and cryptographic token invariants.
 */

export class AdminSessionNotFoundException extends HttpException {
  constructor(message = 'Admin session not found.') {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: 'ADMIN_SESSION_NOT_FOUND',
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AdminSessionRevokedException extends HttpException {
  constructor(message = 'Admin session has been revoked.') {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: 'ADMIN_SESSION_REVOKED',
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AdminSessionExpiredException extends HttpException {
  constructor(message = 'Admin session has expired.') {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: 'ADMIN_SESSION_EXPIRED',
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AdminJwtInvalidException extends HttpException {
  constructor(message = 'Invalid Admin JWT token.') {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: 'ADMIN_JWT_INVALID',
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AdminJwtExpiredException extends HttpException {
  constructor(message = 'Admin access JWT has expired.') {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: 'ADMIN_JWT_EXPIRED',
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AdminUserJwtCrossoverException extends HttpException {
  constructor(message = 'User JWT cannot be used to authenticate Admin APIs.') {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: 'USER_JWT_ADMIN_CROSSOVER_FORBIDDEN',
        message,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class AdminTokenTamperedException extends HttpException {
  constructor(message = 'Admin token signature or claims tampered.') {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: 'ADMIN_TOKEN_TAMPERED',
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
