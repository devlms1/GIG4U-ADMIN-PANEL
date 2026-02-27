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
exports.SpProfileRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const SP_WITH_USER = {
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
};
const SP_WITH_USER_AND_ROLES = {
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
            userRoles: {
                where: { isActive: true },
                include: { role: true },
            },
        },
    },
};
let SpProfileRepository = class SpProfileRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUserId(userId) {
        return this.prisma.spProfile.findUnique({
            where: { userId },
            include: SP_WITH_USER,
        });
    }
    async findByUserIdWithRoles(userId) {
        return this.prisma.spProfile.findUnique({
            where: { userId },
            include: SP_WITH_USER_AND_ROLES,
        });
    }
    async update(userId, dto) {
        const data = { ...dto };
        if (dto.dateOfBirth) {
            data.dateOfBirth = new Date(dto.dateOfBirth);
        }
        const updated = await this.prisma.spProfile.update({
            where: { userId },
            data,
            include: SP_WITH_USER,
        });
        if (updated.spStatus === client_1.SpStatus.PROFILE_INCOMPLETE &&
            updated.fullName &&
            updated.city &&
            updated.state &&
            updated.pincode &&
            updated.gender &&
            updated.dateOfBirth) {
            return this.prisma.spProfile.update({
                where: { userId },
                data: { spStatus: client_1.SpStatus.KYC_PENDING },
                include: SP_WITH_USER,
            });
        }
        return updated;
    }
};
exports.SpProfileRepository = SpProfileRepository;
exports.SpProfileRepository = SpProfileRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SpProfileRepository);
//# sourceMappingURL=sp-profile.repository.js.map