import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { AuditRepository } from './audit.repository';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { createPaginationMeta } from '../common/utils';

@ApiTags('Admin - Audit Logs')
@ApiBearerAuth()
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserType.ADMIN)
export class AuditController {
  constructor(private readonly auditRepo: AuditRepository) {}

  /**
   * GET /admin/audit-logs — Paginated audit logs with filters.
   */
  @Get()
  @Permissions('roles:view')
  @ApiOperation({ summary: 'List audit logs (admin)' })
  async listAuditLogs(@Query() query: ListAuditLogsQueryDto) {
    const { items, total, page, limit } = await this.auditRepo.findAll(query);

    return {
      data: { items, meta: createPaginationMeta(total, page, limit) },
      message: 'Audit logs retrieved',
    };
  }
}
