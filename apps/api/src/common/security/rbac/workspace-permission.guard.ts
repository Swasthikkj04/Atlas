import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WORKSPACE_PERMISSION_KEY } from './require-permission.decorator';
import {
  hasWorkspacePermission,
  WorkspacePermission,
  WorkspaceRole,
} from './workspace-rbac.types';

@Injectable()
export class WorkspacePermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission =
      this.reflector.getAllAndOverride<WorkspacePermission>(
        WORKSPACE_PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'Authentication required for workspace access.',
      );
    }

    // Default authenticated user to OWNER if no role is explicitly assigned
    const userRole: WorkspaceRole =
      user.workspaceRole || user.role || WorkspaceRole.OWNER;

    const allowed = hasWorkspacePermission(userRole, requiredPermission);
    if (!allowed) {
      throw new ForbiddenException(
        `Insufficient workspace permissions. Required: ${requiredPermission}`,
      );
    }

    return true;
  }
}
