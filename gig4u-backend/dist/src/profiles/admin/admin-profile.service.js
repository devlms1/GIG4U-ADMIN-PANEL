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
exports.AdminProfileService = void 0;
const common_1 = require("@nestjs/common");
const admin_profile_repository_1 = require("./admin-profile.repository");
let AdminProfileService = class AdminProfileService {
    adminProfileRepo;
    constructor(adminProfileRepo) {
        this.adminProfileRepo = adminProfileRepo;
    }
    async getOwnProfile(userId) {
        const profile = await this.adminProfileRepo.findByUserId(userId);
        if (!profile) {
            throw new common_1.NotFoundException('Admin profile not found');
        }
        return { data: profile, message: 'Profile retrieved' };
    }
    async updateOwnProfile(userId, dto) {
        const existing = await this.adminProfileRepo.findByUserId(userId);
        if (!existing) {
            throw new common_1.NotFoundException('Admin profile not found');
        }
        const updated = await this.adminProfileRepo.update(userId, dto);
        return { data: updated, message: 'Profile updated successfully' };
    }
};
exports.AdminProfileService = AdminProfileService;
exports.AdminProfileService = AdminProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [admin_profile_repository_1.AdminProfileRepository])
], AdminProfileService);
//# sourceMappingURL=admin-profile.service.js.map