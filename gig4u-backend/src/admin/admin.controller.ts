import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@ApiTags('Admin - Dashboard')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserType.ADMIN)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /admin/stats — Platform overview stats for the admin dashboard.
   */
  @Get('stats')
  @Permissions('analytics:view_dashboard')
  @ApiOperation({ summary: 'Get platform stats (admin dashboard)' })
  async getStats() {
    return this.usersService.getStats();
  }
}
