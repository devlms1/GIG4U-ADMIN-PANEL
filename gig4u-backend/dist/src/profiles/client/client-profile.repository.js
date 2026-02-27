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
exports.ClientProfileRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const CLIENT_WITH_USER_AND_TENANT = {
    user: {
        select: {
            id: true,
            phone: true,
            email: true,
            userType: true,
            status: true,
            isPhoneVerified: true,
            isEmailVerified: true,
            lastLoginAt: true,
            createdAt: true,
        },
    },
    tenant: true,
};
let ClientProfileRepository = class ClientProfileRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUserId(userId) {
        return this.prisma.clientProfile.findUnique({
            where: { userId },
            include: CLIENT_WITH_USER_AND_TENANT,
        });
    }
    async update(userId, dto) {
        return this.prisma.clientProfile.update({
            where: { userId },
            data: dto,
            include: CLIENT_WITH_USER_AND_TENANT,
        });
    }
    async findTeamByTenantId(tenantId) {
        return this.prisma.clientProfile.findMany({
            where: { tenantId },
            include: {
                user: {
                    select: {
                        id: true,
                        phone: true,
                        email: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async createTeamMember(data) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    phone: data.phone,
                    email: data.email,
                    userType: client_1.UserType.CLIENT,
                },
            });
            const profile = await tx.clientProfile.create({
                data: {
                    userId: user.id,
                    tenantId: data.tenantId,
                    clientRole: data.clientRole,
                },
            });
            const roleNameMap = {
                [client_1.ClientRole.ADMIN]: 'CLIENT_ADMIN',
                [client_1.ClientRole.MANAGER]: 'CLIENT_MANAGER',
                [client_1.ClientRole.FINANCE]: 'CLIENT_FINANCE',
                [client_1.ClientRole.VIEWER]: 'CLIENT_VIEWER',
            };
            const role = await tx.role.findUnique({
                where: { name: roleNameMap[data.clientRole] },
            });
            if (role) {
                await tx.userRole.create({
                    data: {
                        userId: user.id,
                        roleId: role.id,
                        tenantId: data.tenantId,
                    },
                });
            }
            return { user, profile };
        });
    }
    async phoneExists(phone) {
        const count = await this.prisma.user.count({ where: { phone } });
        return count > 0;
    }
};
exports.ClientProfileRepository = ClientProfileRepository;
exports.ClientProfileRepository = ClientProfileRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientProfileRepository);
//# sourceMappingURL=client-profile.repository.js.map