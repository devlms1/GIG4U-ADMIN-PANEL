"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminProfileModule = void 0;
const common_1 = require("@nestjs/common");
const admin_profile_controller_1 = require("./admin-profile.controller");
const admin_profile_service_1 = require("./admin-profile.service");
const admin_profile_repository_1 = require("./admin-profile.repository");
let AdminProfileModule = class AdminProfileModule {
};
exports.AdminProfileModule = AdminProfileModule;
exports.AdminProfileModule = AdminProfileModule = __decorate([
    (0, common_1.Module)({
        controllers: [admin_profile_controller_1.AdminProfileController],
        providers: [admin_profile_service_1.AdminProfileService, admin_profile_repository_1.AdminProfileRepository],
        exports: [admin_profile_service_1.AdminProfileService],
    })
], AdminProfileModule);
//# sourceMappingURL=admin-profile.module.js.map