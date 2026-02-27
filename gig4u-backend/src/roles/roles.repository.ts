import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ListRolesQueryDto } from './dto/list-roles-query.dto';
import { calculateSkip } from '../common/utils';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List roles with pagination, filtering, and permission count.
   */
  async findAll(query: ListRolesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.RoleWhereInput = {
      deletedAt: null,
      ...(query.actorType && { actorType: query.actorType }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { displayName: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip: calculateSkip(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { rolePermissions: true, userRoles: true } },
          parent: { select: { id: true, name: true, displayName: true } },
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  /**
   * Find a single role by ID with all permissions.
   */
  async findById(id: string) {
    return this.prisma.role.findFirst({
      where: { id, deletedAt: null },
      include: {
        rolePermissions: {
          include: {
            permission: {
              include: { group: true },
            },
          },
        },
        parent: { select: { id: true, name: true, displayName: true } },
        children: {
          where: { deletedAt: null },
          select: { id: true, name: true, displayName: true },
        },
        _count: { select: { userRoles: true } },
      },
    });
  }

  /**
   * Find a role by its unique name.
   */
  async findByName(name: string) {
    return this.prisma.role.findUnique({ where: { name } });
  }

  /**
   * Create a new role.
   */
  async create(dto: CreateRoleDto, createdById?: string) {
    return this.prisma.role.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        description: dto.description,
        actorType: dto.actorType,
        parentId: dto.parentId,
        createdById,
        isSystem: false,
      },
      include: {
        parent: { select: { id: true, name: true, displayName: true } },
      },
    });
  }

  /**
   * Update a role's mutable fields.
   */
  async update(id: string, dto: UpdateRoleDto) {
    return this.prisma.role.update({
      where: { id },
      data: dto,
      include: {
        _count: { select: { rolePermissions: true, userRoles: true } },
      },
    });
  }

  /**
   * Soft delete a role.
   */
  async softDelete(id: string) {
    return this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  /**
   * Count active user-role assignments for a given role.
   */
  async countActiveAssignments(roleId: string): Promise<number> {
    return this.prisma.userRole.count({
      where: { roleId, isActive: true },
    });
  }
}
