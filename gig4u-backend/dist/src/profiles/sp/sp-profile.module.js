"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpProfileModule = void 0;
const common_1 = require("@nestjs/common");
const sp_profile_controller_1 = require("./sp-profile.controller");
const sp_profile_service_1 = require("./sp-profile.service");
const sp_profile_repository_1 = require("./sp-profile.repository");
let SpProfileModule = class SpProfileModule {
};
exports.SpProfileModule = SpProfileModule;
exports.SpProfileModule = SpProfileModule = __decorate([
    (0, common_1.Module)({
        controllers: [sp_profile_controller_1.SpProfileController],
        providers: [sp_profile_service_1.SpProfileService, sp_profile_repository_1.SpProfileRepository],
        exports: [sp_profile_service_1.SpProfileService],
    })
], SpProfileModule);
//# sourceMappingURL=sp-profile.module.js.map