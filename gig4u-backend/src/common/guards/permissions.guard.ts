import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { JwtPayload } from '../types';

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

/**
 * Guard that checks if the authenticated user holds the required permissions.
 * SUPER_ADMIN bypasses all permission checks.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user as JwtPayload;

    if (user?.roles?.includes(SUPER_ADMIN_ROLE)) {
      return true;
    }

    const hasPermission = requiredPermissions.every((perm) =>
      user?.permissions?.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
