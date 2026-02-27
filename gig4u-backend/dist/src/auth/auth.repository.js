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
exports.AuthRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const USER_WITH_PROFILE_AND_ROLES = {
    clientProfile: { include: { tenant: true } },
    spProfile: true,
    adminProfile: true,
    userRoles: {
        where: { isActive: true },
        include: {
            role: {
                include: {
                    rolePermissions: {
                        include: { permission: true },
                    },
                },
            },
        },
    },
};
let AuthRepository = class AuthRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findUserByPhone(phone) {
        return this.prisma.user.findFirst({
            where: { phone, deletedAt: null },
            include: USER_WITH_PROFILE_AND_ROLES,
        });
    }
    async findUserById(userId) {
        return this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: USER_WITH_PROFILE_AND_ROLES,
        });
    }
    async phoneExists(phone) {
        const count = await this.prisma.user.count({ where: { phone } });
        return count > 0;
    }
    async updateLastLogin(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { lastLoginAt: new Date() },
        });
    }
    async createClientUser(data) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    phone: data.phone,
                    email: data.email,
                    passwordHash: data.passwordHash,
                    userType: client_1.UserType.CLIENT,
                },
            });
            const tenant = await tx.tenant.create({
                data: { companyName: data.companyName },
            });
            await tx.clientProfile.create({
                data: { userId: user.id, tenantId: tenant.id },
            });
            const clientAdminRole = await tx.role.findUnique({
                where: { name: 'CLIENT_ADMIN' },
            });
            if (clientAdminRole) {
                await tx.userRole.create({
                    data: {
                        userId: user.id,
                        roleId: clientAdminRole.id,
                        tenantId: tenant.id,
                    },
                });
            }
            return tx.user.findUniqueOrThrow({
                where: { id: user.id },
                include: USER_WITH_PROFILE_AND_ROLES,
            });
        });
    }
    async createSpUser(data) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    phone: data.phone,
                    email: data.email,
                    passwordHash: data.passwordHash,
                    userType: client_1.UserType.SP,
                },
            });
            await tx.spProfile.create({ data: { userId: user.id } });
            const spRole = await tx.role.findUnique({
                where: { name: 'SP_BASIC' },
            });
            if (spRole) {
                await tx.userRole.create({
                    data: { userId: user.id, roleId: spRole.id },
                });
            }
            return tx.user.findUniqueOrThrow({
                where: { id: user.id },
                include: USER_WITH_PROFILE_AND_ROLES,
            });
        });
    }
    async createRefreshToken(data) {
        return this.prisma.refreshToken.create({ data });
    }
    async findRefreshToken(tokenHash) {
        return this.prisma.refreshToken.findFirst({
            where: { tokenHash, revokedAt: null },
        });
    }
    async revokeRefreshToken(tokenId) {
        await this.prisma.refreshToken.update({
            where: { id: tokenId },
            data: { revokedAt: new Date() },
        });
    }
    async revokeAllUserRefreshTokens(userId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async findAdminRolesForUser(userId) {
        return this.prisma.userRole.findMany({
            where: {
                userId,
                isActive: true,
                role: { actorType: client_1.UserType.ADMIN, isActive: true, deletedAt: null },
            },
            include: {
                role: {
                    include: {
                        rolePermissions: { include: { permission: true } },
                    },
                },
            },
        });
    }
    async userHasRole(userId, roleId) {
        const count = await this.prisma.userRole.count({
            where: { userId, roleId, isActive: true },
        });
        return count > 0;
    }
    async findPermissionsForRole(roleId) {
        const rolePerms = await this.prisma.rolePermission.findMany({
            where: { roleId },
            include: { permission: true },
        });
        return rolePerms.map((rp) => rp.permission.name);
    }
    async createAdminSession(data) {
        return this.prisma.adminSession.create({ data });
    }
    async terminateAdminSessions(userId) {
        await this.prisma.adminSession.updateMany({
            where: { userId, terminatedAt: null },
            data: { terminatedAt: new Date() },
        });
    }
    async findRoleById(roleId) {
        return this.prisma.role.findUnique({
            where: { id: roleId },
            include: {
                rolePermissions: { include: { permission: true } },
            },
        });
    }
};
exports.AuthRepository = AuthRepository;
exports.AuthRepository = AuthRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthRepository);
//# sourceMappingURL=auth.repository.js.map