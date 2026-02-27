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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const roles_repository_1 = require("./roles.repository");
const audit_service_1 = require("../audit/audit.service");
const utils_1 = require("../common/utils");
let RolesService = class RolesService {
    rolesRepo;
    auditService;
    constructor(rolesRepo, auditService) {
        this.rolesRepo = rolesRepo;
        this.auditService = auditService;
    }
    async listRoles(query) {
        const { items, total, page, limit } = await this.rolesRepo.findAll(query);
        return {
            data: {
                items,
                meta: (0, utils_1.createPaginationMeta)(total, page, limit),
            },
            message: 'Roles retrieved',
        };
    }
    async getRoleById(id) {
        const role = await this.rolesRepo.findById(id);
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return { data: role, message: 'Role retrieved' };
    }
    async createRole(dto, actorUserId) {
        const existing = await this.rolesRepo.findByName(dto.name);
        if (existing) {
            throw new common_1.ConflictException(`Role name "${dto.name}" already exists`);
        }
        if (dto.parentId) {
            const parent = await this.rolesRepo.findById(dto.parentId);
            if (!parent) {
                throw new common_1.NotFoundException('Parent role not found');
            }
            if (parent.actorType !== dto.actorType) {
                throw new common_1.BadRequestException('Parent role must have the same actorType');
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
    async updateRole(id, dto, actorUserId) {
        const role = await this.rolesRepo.findById(id);
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
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
    async deleteRole(id, actorUserId) {
        const role = await this.rolesRepo.findById(id);
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        if (role.isSystem) {
            throw new common_1.ForbiddenException('System roles cannot be deleted');
        }
        const activeCount = await this.rolesRepo.countActiveAssignments(id);
        if (activeCount > 0) {
            throw new common_1.ConflictException(`Cannot delete role: ${activeCount} active user assignment(s) exist. Remove them first.`);
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
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [roles_repository_1.RolesRepository,
        audit_service_1.AuditService])
], RolesService);
//# sourceMappingURL=roles.service.js.map