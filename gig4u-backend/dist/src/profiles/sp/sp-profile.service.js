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
exports.SpProfileService = void 0;
const common_1 = require("@nestjs/common");
const sp_profile_repository_1 = require("./sp-profile.repository");
const audit_service_1 = require("../../audit/audit.service");
let SpProfileService = class SpProfileService {
    spProfileRepo;
    auditService;
    constructor(spProfileRepo, auditService) {
        this.spProfileRepo = spProfileRepo;
        this.auditService = auditService;
    }
    async getOwnProfile(userId) {
        const profile = await this.spProfileRepo.findByUserId(userId);
        if (!profile) {
            throw new common_1.NotFoundException('SP profile not found');
        }
        return { data: profile, message: 'Profile retrieved' };
    }
    async updateOwnProfile(userId, dto) {
        const existing = await this.spProfileRepo.findByUserId(userId);
        if (!existing) {
            throw new common_1.NotFoundException('SP profile not found');
        }
        const updated = await this.spProfileRepo.update(userId, dto);
        await this.auditService.log({
            actorUserId: userId,
            action: 'SP_PROFILE_UPDATED',
            targetType: 'SpProfile',
            targetId: userId,
            metadata: { updatedFields: Object.keys(dto) },
        });
        return { data: updated, message: 'Profile updated successfully' };
    }
    async getProfileById(userId) {
        const profile = await this.spProfileRepo.findByUserIdWithRoles(userId);
        if (!profile) {
            throw new common_1.NotFoundException('SP profile not found');
        }
        return { data: profile, message: 'Profile retrieved' };
    }
};
exports.SpProfileService = SpProfileService;
exports.SpProfileService = SpProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sp_profile_repository_1.SpProfileRepository,
        audit_service_1.AuditService])
], SpProfileService);
//# sourceMappingURL=sp-profile.service.js.map