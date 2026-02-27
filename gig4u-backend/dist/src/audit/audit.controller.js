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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const audit_repository_1 = require("./audit.repository");
const list_audit_logs_query_dto_1 = require("./dto/list-audit-logs-query.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const utils_1 = require("../common/utils");
let AuditController = class AuditController {
    auditRepo;
    constructor(auditRepo) {
        this.auditRepo = auditRepo;
    }
    async listAuditLogs(query) {
        const { items, total, page, limit } = await this.auditRepo.findAll(query);
        return {
            data: { items, meta: (0, utils_1.createPaginationMeta)(total, page, limit) },
            message: 'Audit logs retrieved',
        };
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('roles:view'),
    (0, swagger_1.ApiOperation)({ summary: 'List audit logs (admin)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_audit_logs_query_dto_1.ListAuditLogsQueryDto]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "listAuditLogs", null);
exports.AuditController = AuditController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Audit Logs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin/audit-logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)(client_1.UserType.ADMIN),
    __metadata("design:paramtypes", [audit_repository_1.AuditRepository])
], AuditController);
//# sourceMappingURL=audit.controller.js.map