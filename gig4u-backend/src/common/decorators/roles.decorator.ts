import { SetMetadata } from '@nestjs/common';
import { UserType } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Marks an endpoint as requiring one of the specified user-type roles.
 * Usage: @Roles(UserType.ADMIN, UserType.CLIENT)
 */
export const Roles = (...roles: UserType[]) => SetMetadata(ROLES_KEY, roles);
