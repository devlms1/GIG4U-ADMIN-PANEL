"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const permissions_repository_1 = require("./permissions.repository");
const audit_service_1 = require("../audit/audit.service");
let PermissionsService = class PermissionsService {
    permRepo;
    auditService;
    constructor(permRepo, auditService) {
        this.permRepo = permRepo;
        this.auditService = auditService;
    }
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
    async assignPermissionsToRole(roleId, dto, actorUserId) {
        if (!(await this.permRepo.roleExists(roleId))) {
            throw new common_1.NotFoundException('Role not found');
        }
        if (!(await this.permRepo.permissionsExist(dto.permissionIds))) {
            throw new common_1.BadRequestException('One or more permission IDs are invalid');
        }
        const created = await this.permRepo.assignPermissionsToRole(roleId, dto.permissionIds, actorUserId);
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
    async revokePermissionsFromRole(roleId, dto, actorUserId) {
        if (!(await this.permRepo.roleExists(roleId))) {
            throw new common_1.NotFoundException('Role not found');
        }
        const removed = await this.permRepo.revokePermissionsFromRole(roleId, dto.permissionIds);
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
    async assignRoleToUser(userId, dto, actorUserId) {
        if (!(await this.permRepo.userExists(userId))) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!(await this.permRepo.roleExists(dto.roleId))) {
            throw new common_1.NotFoundException('Role not found');
        }
        const exists = await this.permRepo.userRoleExists(userId, dto.roleId, dto.tenantId);
        if (exists) {
            throw new common_1.ConflictException('User already has this role');
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
    async revokeRoleFromUser(userId, roleId, actorUserId) {
        if (!(await this.permRepo.userExists(userId))) {
            throw new common_1.NotFoundException('User not found');
        }
        const deactivated = await this.permRepo.deactivateUserRole(userId, roleId);
        if (deactivated === 0) {
            throw new common_1.NotFoundException('Active role assignment not found');
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
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [permissions_repository_1.PermissionsRepository,
        audit_service_1.AuditService])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map