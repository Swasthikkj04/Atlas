import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * ADMIN-006: Admin Authorization Exceptions
 *
 * Dedicated error classes for authorization boundaries and capability rejections.
 */

export class AdminAuthorizationRequiredException extends HttpException {
  constructor(message = 'Admin authorization required.') {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: 'ADMIN_AUTHORIZATION_REQUIRED',
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AdminForbiddenException extends HttpException {
  constructor(message = 'Access to Admin plane denied.') {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: 'ADMIN_ACCESS_FORBIDDEN',
        message,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class AdminCapabilityDeniedException extends HttpException {
  constructor(capability: string) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: 'ADMIN_CAPABILITY_DENIED',
        message: `Admin operation requires capability: ${capability}`,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
