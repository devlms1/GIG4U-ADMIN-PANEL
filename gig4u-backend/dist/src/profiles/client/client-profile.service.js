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
exports.ClientProfileService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const client_profile_repository_1 = require("./client-profile.repository");
let ClientProfileService = class ClientProfileService {
    clientProfileRepo;
    constructor(clientProfileRepo) {
        this.clientProfileRepo = clientProfileRepo;
    }
    async getOwnProfile(userId) {
        const profile = await this.clientProfileRepo.findByUserId(userId);
        if (!profile) {
            throw new common_1.NotFoundException('Client profile not found');
        }
        return { data: profile, message: 'Profile retrieved' };
    }
    async updateOwnProfile(userId, dto) {
        const existing = await this.clientProfileRepo.findByUserId(userId);
        if (!existing) {
            throw new common_1.NotFoundException('Client profile not found');
        }
        const updated = await this.clientProfileRepo.update(userId, dto);
        return { data: updated, message: 'Profile updated successfully' };
    }
    async getTeam(currentUser) {
        const profile = await this.clientProfileRepo.findByUserId(currentUser.sub);
        if (!profile) {
            throw new common_1.NotFoundException('Client profile not found');
        }
        if (profile.clientRole !== client_1.ClientRole.ADMIN) {
            throw new common_1.ForbiddenException('Only client admins can view the team');
        }
        const team = await this.clientProfileRepo.findTeamByTenantId(profile.tenantId);
        return { data: team, message: 'Team retrieved' };
    }
    async inviteTeamMember(currentUser, dto) {
        const profile = await this.clientProfileRepo.findByUserId(currentUser.sub);
        if (!profile) {
            throw new common_1.NotFoundException('Client profile not found');
        }
        if (profile.clientRole !== client_1.ClientRole.ADMIN) {
            throw new common_1.ForbiddenException('Only client admins can invite members');
        }
        const phoneExists = await this.clientProfileRepo.phoneExists(dto.phone);
        if (phoneExists) {
            throw new common_1.ConflictException('Phone number is already registered');
        }
        const { user, profile: newProfile } = await this.clientProfileRepo.createTeamMember({
            phone: dto.phone,
            email: dto.email,
            tenantId: profile.tenantId,
            clientRole: dto.clientRole,
        });
        return {
            data: { user: { id: user.id, phone: user.phone, email: user.email }, profile: newProfile },
            message: 'Team member invited successfully',
        };
    }
};
exports.ClientProfileService = ClientProfileService;
exports.ClientProfileService = ClientProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [client_profile_repository_1.ClientProfileRepository])
], ClientProfileService);
//# sourceMappingURL=client-profile.service.js.map