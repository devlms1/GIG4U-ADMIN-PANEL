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
exports.AdminProfileRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const ADMIN_WITH_USER_AND_ROLE = {
    user: {
        select: {
            id: true,
            phone: true,
            email: true,
            userType: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
        },
    },
    activeRole: {
        select: {
            id: true,
            name: true,
            displayName: true,
        },
    },
};
let AdminProfileRepository = class AdminProfileRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUserId(userId) {
        return this.prisma.adminProfile.findUnique({
            where: { userId },
            include: ADMIN_WITH_USER_AND_ROLE,
        });
    }
    async update(userId, dto) {
        return this.prisma.adminProfile.update({
            where: { userId },
            data: dto,
            include: ADMIN_WITH_USER_AND_ROLE,
        });
    }
};
exports.AdminProfileRepository = AdminProfileRepository;
exports.AdminProfileRepository = AdminProfileRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminProfileRepository);
//# sourceMappingURL=admin-profile.repository.js.map