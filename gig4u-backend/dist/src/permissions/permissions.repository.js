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
exports.PermissionsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PermissionsRepository = class PermissionsRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async roleExists(roleId) {
        const count = await this.prisma.role.count({
            where: { id: roleId, deletedAt: null },
        });
        return count > 0;
    }
    async userExists(userId) {
        const count = await this.prisma.user.count({
            where: { id: userId, deletedAt: null },
        });
        return count > 0;
    }
    async permissionsExist(ids) {
        const count = await this.prisma.permission.count({
            where: { id: { in: ids } },
        });
        return count === ids.length;
    }
    async assignPermissionsToRole(roleId, permissionIds, grantedById) {
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
    async revokePermissionsFromRole(roleId, permissionIds) {
        const result = await this.prisma.rolePermission.deleteMany({
            where: {
                roleId,
                permissionId: { in: permissionIds },
            },
        });
        return result.count;
    }
    async assignRoleToUser(data) {
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
    async deactivateUserRole(userId, roleId) {
        const result = await this.prisma.userRole.updateMany({
            where: { userId, roleId, isActive: true },
            data: { isActive: false },
        });
        return result.count;
    }
    async userRoleExists(userId, roleId, tenantId) {
        const count = await this.prisma.userRole.count({
            where: { userId, roleId, tenantId: tenantId ?? null, isActive: true },
        });
        return count > 0;
    }
};
exports.PermissionsRepository = PermissionsRepository;
exports.PermissionsRepository = PermissionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PermissionsRepository);
//# sourceMappingURL=permissions.repository.js.map