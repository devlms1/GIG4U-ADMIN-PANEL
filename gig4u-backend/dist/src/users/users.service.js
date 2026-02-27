"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const users_repository_1 = require("./users.repository");
const audit_service_1 = require("../audit/audit.service");
const utils_1 = require("../common/utils");
const BCRYPT_ROUNDS = 12;
let UsersService = class UsersService {
    usersRepo;
    auditService;
    constructor(usersRepo, auditService) {
        this.usersRepo = usersRepo;
        this.auditService = auditService;
    }
    async listUsers(query) {
        const { items, total, page, limit } = await this.usersRepo.findAll(query);
        return {
            data: { items, meta: (0, utils_1.createPaginationMeta)(total, page, limit) },
            message: 'Users retrieved',
        };
    }
    async getUserById(id) {
        const user = await this.usersRepo.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const { passwordHash: _, ...sanitised } = user;
        return { data: sanitised, message: 'User retrieved' };
    }
    async updateUserStatus(id, dto, actorUserId) {
        const user = await this.usersRepo.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const previousStatus = user.status;
        const updated = await this.usersRepo.updateStatus(id, dto.status);
        await this.auditService.log({
            actorUserId,
            action: 'USER_STATUS_CHANGED',
            targetType: 'User',
            targetId: id,
            metadata: {
                previousStatus,
                newStatus: dto.status,
                reason: dto.reason,
            },
        });
        return { data: updated, message: `User status changed to ${dto.status}` };
    }
    async createAdmin(dto, actorUserId) {
        const exists = await this.usersRepo.phoneExists(dto.phone);
        if (exists) {
            throw new common_1.ConflictException('Phone number is already registered');
        }
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const user = await this.usersRepo.createAdminUser({
            phone: dto.phone,
            email: dto.email,
            passwordHash,
            fullName: dto.fullName,
            employeeId: dto.employeeId,
            department: dto.department,
        });
        await this.auditService.log({
            actorUserId,
            action: 'ADMIN_USER_CREATED',
            targetType: 'User',
            targetId: user.id,
            metadata: { phone: dto.phone, fullName: dto.fullName },
        });
        return { data: user, message: 'Admin user created' };
    }
    async getStats() {
        const counts = await this.usersRepo.countByType();
        const pendingKyc = await this.usersRepo.countPendingKyc();
        return {
            data: {
                ...counts,
                pendingKyc,
                activeProjects: 0,
            },
            message: 'Stats retrieved',
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map