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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientProfileController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const client_profile_service_1 = require("./client-profile.service");
const update_client_profile_dto_1 = require("./dto/update-client-profile.dto");
const invite_team_member_dto_1 = require("./dto/invite-team-member.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
let ClientProfileController = class ClientProfileController {
    clientProfileService;
    constructor(clientProfileService) {
        this.clientProfileService = clientProfileService;
    }
    async getOwnProfile(user) {
        return this.clientProfileService.getOwnProfile(user.sub);
    }
    async updateOwnProfile(user, dto) {
        return this.clientProfileService.updateOwnProfile(user.sub, dto);
    }
    async getTeam(user) {
        return this.clientProfileService.getTeam(user);
    }
    async inviteTeamMember(user, dto) {
        return this.clientProfileService.inviteTeamMember(user, dto);
    }
};
exports.ClientProfileController = ClientProfileController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get own client profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientProfileController.prototype, "getOwnProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update own client profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_client_profile_dto_1.UpdateClientProfileDto]),
    __metadata("design:returntype", Promise)
], ClientProfileController.prototype, "updateOwnProfile", null);
__decorate([
    (0, common_1.Get)('team'),
    (0, swagger_1.ApiOperation)({ summary: 'Get team members (client admin only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientProfileController.prototype, "getTeam", null);
__decorate([
    (0, common_1.Post)('team/invite'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Invite a team member (client admin only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, invite_team_member_dto_1.InviteTeamMemberDto]),
    __metadata("design:returntype", Promise)
], ClientProfileController.prototype, "inviteTeamMember", null);
exports.ClientProfileController = ClientProfileController = __decorate([
    (0, swagger_1.ApiTags)('Client Profile'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserType.CLIENT),
    (0, common_1.Controller)('client'),
    __metadata("design:paramtypes", [client_profile_service_1.ClientProfileService])
], ClientProfileController);
//# sourceMappingURL=client-profile.controller.js.map