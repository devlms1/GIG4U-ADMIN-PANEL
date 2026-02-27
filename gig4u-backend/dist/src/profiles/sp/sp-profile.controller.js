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
exports.SpProfileController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const sp_profile_service_1 = require("./sp-profile.service");
const update_sp_profile_dto_1 = require("./dto/update-sp-profile.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
let SpProfileController = class SpProfileController {
    spProfileService;
    constructor(spProfileService) {
        this.spProfileService = spProfileService;
    }
    async getOwnProfile(user) {
        return this.spProfileService.getOwnProfile(user.sub);
    }
    async updateOwnProfile(user, dto) {
        return this.spProfileService.updateOwnProfile(user.sub, dto);
    }
    async getProfileById(id) {
        return this.spProfileService.getProfileById(id);
    }
};
exports.SpProfileController = SpProfileController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserType.SP),
    (0, swagger_1.ApiOperation)({ summary: 'Get own SP profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SpProfileController.prototype, "getOwnProfile", null);
__decorate([
    (0, common_1.Patch)(),
    (0, roles_decorator_1.Roles)(client_1.UserType.SP),
    (0, swagger_1.ApiOperation)({ summary: 'Update own SP profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_sp_profile_dto_1.UpdateSpProfileDto]),
    __metadata("design:returntype", Promise)
], SpProfileController.prototype, "updateOwnProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserType.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: view SP profile by user ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SpProfileController.prototype, "getProfileById", null);
exports.SpProfileController = SpProfileController = __decorate([
    (0, swagger_1.ApiTags)('SP Profile'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('sp/profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [sp_profile_service_1.SpProfileService])
], SpProfileController);
//# sourceMappingURL=sp-profile.controller.js.map