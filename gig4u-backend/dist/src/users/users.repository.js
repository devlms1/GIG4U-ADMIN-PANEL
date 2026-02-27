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
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const utils_1 = require("../common/utils");
const USER_SUMMARY_SELECT = {
    id: true,
    phone: true,
    email: true,
    userType: true,
    status: true,
    isPhoneVerified: true,
    isEmailVerified: true,
    lastLoginAt: true,
    createdAt: true,
    clientProfile: { select: { fullName: true, tenantId: true } },
    spProfile: { select: { fullName: true, spStatus: true } },
    adminProfile: { select: { fullName: true, employeeId: true } },
};
const USER_DETAIL_INCLUDE = {
    clientProfile: { include: { tenant: true } },
    spProfile: true,
    adminProfile: { include: { activeRole: true } },
    userRoles: {
        where: { isActive: true },
        include: {
            role: {
                include: {
                    rolePermissions: { include: { permission: true } },
                },
            },
        },
    },
};
let UsersRepository = class UsersRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 15;
        const where = {
            deletedAt: null,
            ...(query.userType && { userType: query.userType }),
            ...(query.status && { status: query.status }),
            ...(query.search && {
                OR: [
                    { phone: { contains: query.search } },
                    { email: { contains: query.search, mode: 'insensitive' } },
                ],
            }),
        };
        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: USER_SUMMARY_SELECT,
                skip: (0, utils_1.calculateSkip)(page, limit),
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return { items, total, page, limit };
    }
    async findById(id) {
        return this.prisma.user.findFirst({
            where: { id, deletedAt: null },
            include: USER_DETAIL_INCLUDE,
        });
    }
    async updateStatus(id, status) {
        return this.prisma.user.update({
            where: { id },
            data: { status },
            select: USER_SUMMARY_SELECT,
        });
    }
    async phoneExists(phone) {
        const count = await this.prisma.user.count({ where: { phone } });
        return count > 0;
    }
    async createAdminUser(data) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    phone: data.phone,
                    email: data.email,
                    passwordHash: data.passwordHash,
                    userType: client_1.UserType.ADMIN,
                },
            });
            await tx.adminProfile.create({
                data: {
                    userId: user.id,
                    fullName: data.fullName,
                    employeeId: data.employeeId,
                    department: data.department,
                },
            });
            return tx.user.findUniqueOrThrow({
                where: { id: user.id },
                select: USER_SUMMARY_SELECT,
            });
        });
    }
    async countByType() {
        const [totalUsers, clientCount, spCount, adminCount] = await Promise.all([
            this.prisma.user.count({ where: { deletedAt: null } }),
            this.prisma.user.count({ where: { userType: client_1.UserType.CLIENT, deletedAt: null } }),
            this.prisma.user.count({ where: { userType: client_1.UserType.SP, deletedAt: null } }),
            this.prisma.user.count({ where: { userType: client_1.UserType.ADMIN, deletedAt: null } }),
        ]);
        return { totalUsers, clientCount, spCount, adminCount };
    }
    async countPendingKyc() {
        return this.prisma.spProfile.count({
            where: { spStatus: { in: ['KYC_PENDING', 'KYC_SUBMITTED'] } },
        });
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersRepository);
//# sourceMappingURL=users.repository.js.map