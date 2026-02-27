"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_module_1 = require("./config/config.module");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const roles_module_1 = require("./roles/roles.module");
const permissions_module_1 = require("./permissions/permissions.module");
const client_profile_module_1 = require("./profiles/client/client-profile.module");
const sp_profile_module_1 = require("./profiles/sp/sp-profile.module");
const admin_profile_module_1 = require("./profiles/admin/admin-profile.module");
const tenants_module_1 = require("./tenants/tenants.module");
const admin_module_1 = require("./admin/admin.module");
const audit_module_1 = require("./audit/audit.module");
const filters_1 = require("./common/filters");
const interceptors_1 = require("./common/interceptors");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.AppConfigModule,
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            permissions_module_1.PermissionsModule,
            client_profile_module_1.ClientProfileModule,
            sp_profile_module_1.SpProfileModule,
            admin_profile_module_1.AdminProfileModule,
            tenants_module_1.TenantsModule,
            admin_module_1.AdminModule,
            audit_module_1.AuditModule,
        ],
        providers: [
            {
                provide: core_1.APP_PIPE,
                useValue: new common_1.ValidationPipe({
                    whitelist: true,
                    forbidNonWhitelisted: true,
                    transform: true,
                    transformOptions: { enableImplicitConversion: true },
                }),
            },
            { provide: core_1.APP_FILTER, useClass: filters_1.HttpExceptionFilter },
            { provide: core_1.APP_INTERCEPTOR, useClass: interceptors_1.LoggingInterceptor },
            { provide: core_1.APP_INTERCEPTOR, useClass: interceptors_1.ResponseInterceptor },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map