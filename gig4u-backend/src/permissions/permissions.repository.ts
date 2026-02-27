import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all permissions grouped by their permission group.
   */
  async findAllGrouped() {
    return this.prisma.permissionGroup.findMany({
      orderBy: { name: 'asc' },
      include: {
        permissions: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  /**
   * Verify that a role exists and is not deleted.
   */
  async roleExists(roleId: string): Promise<boolean> {
    const count = await this.prisma.role.count({
      where: { id: roleId, deletedAt: null },
    });
    return count > 0;
  }

  /**
   * Verify that a user exists and is not deleted.
   */
  async userExists(userId: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id: userId, deletedAt: null },
    });
    return count > 0;
  }

  /**
   * Verify a list of permission IDs all exist.
   */
  async permissionsExist(ids: string[]): Promise<boolean> {
    const count = await this.prisma.permission.count({
      where: { id: { in: ids } },
    });
    return count === ids.length;
  }

  /**
   * Assign permissions to a role (upsert — skip existing).
   */
  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
    grantedById?: string,
  ): Promise<number> {
    let created = 0;

    for (const permissionId of permissionIds) {
      const existing = await this.prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId, permissionId } },
      });

      if (!existing) {
        await this.prisma.rolePermission.create({
          data: { roleId, permissionId, grantedById },
        });
        created++;
      }
    }

    return created;
  }

  /**
   * Revoke permissions from a role.
   */
  async revokePermissionsFromRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<number> {
    const result = await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: { in: permissionIds },
      },
    });
    return result.count;
  }

  /**
   * Assign a role to a user (creates a user_role record).
   */
  async assignRoleToUser(data: {
    userId: string;
    roleId: string;
    tenantId?: string;
    expiresAt?: Date;
    assignedById?: string;
  }) {
    return this.prisma.userRole.create({
      data: {
        userId: data.userId,
        roleId: data.roleId,
        tenantId: data.tenantId,
        expiresAt: data.expiresAt,
        assignedById: data.assignedById,
      },
      include: {
        role: { select: { id: true, name: true, displayName: true } },
      },
    });
  }

  /**
   * Deactivate a user-role assignment.
   */
  async deactivateUserRole(userId: string, roleId: string): Promise<number> {
    const result = await this.prisma.userRole.updateMany({
      where: { userId, roleId, isActive: true },
      data: { isActive: false },
    });
    return result.count;
  }

  /**
   * Check whether a user already has a specific role assigned and active.
   */
  async userRoleExists(
    userId: string,
    roleId: string,
    tenantId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.userRole.count({
      where: { userId, roleId, tenantId: tenantId ?? null, isActive: true },
    });
    return count > 0;
  }
}
