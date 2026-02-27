import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PermissionsRepository } from './permissions.repository';
import { AssignPermissionsDto, RevokePermissionsDto, AssignUserRoleDto } from './dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly permRepo: PermissionsRepository,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Returns all permissions grouped by their permission group.
   */
  async listPermissions() {
    const groups = await this.permRepo.findAllGrouped();

    return {
      data: {
        groups: groups.map((g) => ({
          id: g.id,
          groupName: g.name,
          displayName: g.displayName,
          permissions: g.permissions,
        })),
      },
      message: 'Permissions retrieved',
    };
  }

  /**
   * Assigns permissions to a role. Skips any that are already assigned.
   */
  async assignPermissionsToRole(
    roleId: string,
    dto: AssignPermissionsDto,
    actorUserId: string,
  ) {
    if (!(await this.permRepo.roleExists(roleId))) {
      throw new NotFoundException('Role not found');
    }

    if (!(await this.permRepo.permissionsExist(dto.permissionIds))) {
      throw new BadRequestException(
        'One or more permission IDs are invalid',
      );
    }

    const created = await this.permRepo.assignPermissionsToRole(
      roleId,
      dto.permissionIds,
      actorUserId,
    );

    await this.auditService.log({
      actorUserId,
      action: 'PERMISSIONS_ASSIGNED_TO_ROLE',
      targetType: 'Role',
      targetId: roleId,
      metadata: {
        permissionIds: dto.permissionIds,
        newlyAssigned: created,
      },
    });

    return {
      data: { assigned: created, total: dto.permissionIds.length },
      message: `${created} permission(s) assigned`,
    };
  }

  /**
   * Revokes permissions from a role.
   */
  async revokePermissionsFromRole(
    roleId: string,
    dto: RevokePermissionsDto,
    actorUserId: string,
  ) {
    if (!(await this.permRepo.roleExists(roleId))) {
      throw new NotFoundException('Role not found');
    }

    const removed = await this.permRepo.revokePermissionsFromRole(
      roleId,
      dto.permissionIds,
    );

    await this.auditService.log({
      actorUserId,
      action: 'PERMISSIONS_REVOKED_FROM_ROLE',
      targetType: 'Role',
      targetId: roleId,
      metadata: { permissionIds: dto.permissionIds, removed },
    });

    return {
      data: { removed },
      message: `${removed} permission(s) revoked`,
    };
  }

  /**
   * Assigns a role to a user.
   */
  async assignRoleToUser(
    userId: string,
    dto: AssignUserRoleDto,
    actorUserId: string,
  ) {
    if (!(await this.permRepo.userExists(userId))) {
      throw new NotFoundException('User not found');
    }

    if (!(await this.permRepo.roleExists(dto.roleId))) {
      throw new NotFoundException('Role not found');
    }

    const exists = await this.permRepo.userRoleExists(
      userId,
      dto.roleId,
      dto.tenantId,
    );
    if (exists) {
      throw new ConflictException('User already has this role');
    }

    const userRole = await this.permRepo.assignRoleToUser({
      userId,
      roleId: dto.roleId,
      tenantId: dto.tenantId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      assignedById: actorUserId,
    });

    await this.auditService.log({
      actorUserId,
      action: 'ROLE_ASSIGNED_TO_USER',
      targetType: 'User',
      targetId: userId,
      metadata: { roleId: dto.roleId, tenantId: dto.tenantId },
    });

    return { data: userRole, message: 'Role assigned to user' };
  }

  /**
   * Deactivates a user-role assignment.
   */
  async revokeRoleFromUser(
    userId: string,
    roleId: string,
    actorUserId: string,
  ) {
    if (!(await this.permRepo.userExists(userId))) {
      throw new NotFoundException('User not found');
    }

    const deactivated = await this.permRepo.deactivateUserRole(userId, roleId);

    if (deactivated === 0) {
      throw new NotFoundException('Active role assignment not found');
    }

    await this.auditService.log({
      actorUserId,
      action: 'ROLE_REVOKED_FROM_USER',
      targetType: 'User',
      targetId: userId,
      metadata: { roleId },
    });

    return { data: null, message: 'Role revoked from user' };
  }
}
