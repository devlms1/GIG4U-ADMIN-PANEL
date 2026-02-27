import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { PermissionsService } from './permissions.service';
import { AssignPermissionsDto, RevokePermissionsDto, AssignUserRoleDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { JwtPayload } from '../common/types';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserType.ADMIN)
@Controller()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * GET /permissions — List all permissions grouped by permission group.
   */
  @Get('permissions')
  @Permissions('roles:read')
  @ApiOperation({ summary: 'List all permissions (grouped)' })
  async listPermissions() {
    return this.permissionsService.listPermissions();
  }

  /**
   * POST /roles/:roleId/permissions — Assign permissions to a role.
   */
  @Post('roles/:roleId/permissions')
  @Permissions('roles:assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign permissions to a role' })
  async assignPermissions(
    @Param('roleId') roleId: string,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.permissionsService.assignPermissionsToRole(
      roleId,
      dto,
      user.sub,
    );
  }

  /**
   * DELETE /roles/:roleId/permissions — Revoke permissions from a role.
   */
  @Delete('roles/:roleId/permissions')
  @Permissions('roles:assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke permissions from a role' })
  async revokePermissions(
    @Param('roleId') roleId: string,
    @Body() dto: RevokePermissionsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.permissionsService.revokePermissionsFromRole(
      roleId,
      dto,
      user.sub,
    );
  }

  /**
   * POST /users/:userId/roles — Assign a role to a user.
   */
  @Post('users/:userId/roles')
  @Permissions('roles:assign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a role to a user' })
  async assignRoleToUser(
    @Param('userId') userId: string,
    @Body() dto: AssignUserRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.permissionsService.assignRoleToUser(userId, dto, user.sub);
  }

  /**
   * DELETE /users/:userId/roles/:roleId — Deactivate a user-role assignment.
   */
  @Delete('users/:userId/roles/:roleId')
  @Permissions('roles:assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a role from a user' })
  async revokeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.permissionsService.revokeRoleFromUser(
      userId,
      roleId,
      user.sub,
    );
  }
}
