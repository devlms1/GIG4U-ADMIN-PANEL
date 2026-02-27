import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { CreateRoleDto, UpdateRoleDto, ListRolesQueryDto } from './dto';
import { AuditService } from '../audit/audit.service';
import { createPaginationMeta } from '../common/utils';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepo: RolesRepository,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Lists all non-deleted roles with pagination, optional filters, and permission counts.
   */
  async listRoles(query: ListRolesQueryDto) {
    const { items, total, page, limit } = await this.rolesRepo.findAll(query);

    return {
      data: {
        items,
        meta: createPaginationMeta(total, page, limit),
      },
      message: 'Roles retrieved',
    };
  }

  /**
   * Returns a single role with its full permission list and children.
   */
  async getRoleById(id: string) {
    const role = await this.rolesRepo.findById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return { data: role, message: 'Role retrieved' };
  }

  /**
   * Creates a new non-system role.
   * Validates name uniqueness and parent actorType match.
   */
  async createRole(dto: CreateRoleDto, actorUserId: string) {
    const existing = await this.rolesRepo.findByName(dto.name);
    if (existing) {
      throw new ConflictException(`Role name "${dto.name}" already exists`);
    }

    if (dto.parentId) {
      const parent = await this.rolesRepo.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundException('Parent role not found');
      }
      if (parent.actorType !== dto.actorType) {
        throw new BadRequestException(
          'Parent role must have the same actorType',
        );
      }
    }

    const role = await this.rolesRepo.create(dto, actorUserId);

    await this.auditService.log({
      actorUserId,
      action: 'ROLE_CREATED',
      targetType: 'Role',
      targetId: role.id,
      metadata: { roleName: role.name, actorType: role.actorType },
    });

    return { data: role, message: 'Role created successfully' };
  }

  /**
   * Updates mutable fields of a role.
   * System roles cannot have their name or actorType changed (those fields
   * are not exposed in UpdateRoleDto, so this is inherently safe).
   */
  async updateRole(id: string, dto: UpdateRoleDto, actorUserId: string) {
    const role = await this.rolesRepo.findById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const updated = await this.rolesRepo.update(id, dto);

    await this.auditService.log({
      actorUserId,
      action: 'ROLE_UPDATED',
      targetType: 'Role',
      targetId: id,
      metadata: { updatedFields: Object.keys(dto) },
    });

    return { data: updated, message: 'Role updated successfully' };
  }

  /**
   * Soft-deletes a non-system role. Blocks deletion if the role has active assignments.
   */
  async deleteRole(id: string, actorUserId: string) {
    const role = await this.rolesRepo.findById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be deleted');
    }

    const activeCount = await this.rolesRepo.countActiveAssignments(id);
    if (activeCount > 0) {
      throw new ConflictException(
        `Cannot delete role: ${activeCount} active user assignment(s) exist. Remove them first.`,
      );
    }

    await this.rolesRepo.softDelete(id);

    await this.auditService.log({
      actorUserId,
      action: 'ROLE_DELETED',
      targetType: 'Role',
      targetId: id,
      metadata: { roleName: role.name },
    });

    return { data: null, message: 'Role deleted successfully' };
  }
}
