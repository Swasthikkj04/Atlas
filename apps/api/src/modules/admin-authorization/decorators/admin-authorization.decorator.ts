import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
  CustomDecorator,
} from '@nestjs/common';
import { AdminCapability } from '../contracts/admin-authorization.contract';
import { AdminSessionContext } from '../../admin-session/contracts/admin-session.contract';

export const ADMIN_AUTH_GUARD_KEY = 'ADMIN_AUTH_GUARD_KEY';
export const ADMIN_CAPABILITIES_KEY = 'ADMIN_CAPABILITIES_KEY';

/**
 * Decorator to mark a controller or endpoint as requiring Admin authorization.
 */
export const RequireAdmin = (): CustomDecorator<string> =>
  SetMetadata(ADMIN_AUTH_GUARD_KEY, true);

/**
 * Decorator to require specific Admin capabilities.
 */
export const RequireAdminCapability = (
  ...capabilities: AdminCapability[]
): CustomDecorator<string> => SetMetadata(ADMIN_CAPABILITIES_KEY, capabilities);

/**
 * Parameter decorator to extract the authenticated AdminSessionContext from the request.
 */
export const CurrentAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AdminSessionContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.admin;
  },
);
