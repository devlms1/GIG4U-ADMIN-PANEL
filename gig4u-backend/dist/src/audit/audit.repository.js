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
exports.AuditRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const utils_1 = require("../common/utils");
let AuditRepository = class AuditRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = {
            ...(query.actorUserId && { actorUserId: query.actorUserId }),
            ...(query.action && { action: query.action }),
            ...(query.targetType && { targetType: query.targetType }),
            ...((query.startDate || query.endDate) && {
                createdAt: {
                    ...(query.startDate && { gte: new Date(query.startDate) }),
                    ...(query.endDate && { lte: new Date(query.endDate) }),
                },
            }),
        };
        const [items, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip: (0, utils_1.calculateSkip)(page, limit),
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    actorUser: {
                        select: {
                            id: true,
                            phone: true,
                            email: true,
                            userType: true,
                            adminProfile: { select: { fullName: true } },
                        },
                    },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return { items, total, page, limit };
    }
};
exports.AuditRepository = AuditRepository;
exports.AuditRepository = AuditRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditRepository);
//# sourceMappingURL=audit.repository.js.map