import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, ListRolesQueryDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { JwtPayload } from '../common/types';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserType.ADMIN)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * GET /roles — List all roles with pagination and filters.
   */
  @Get()
  @Permissions('roles:read')
  @ApiOperation({ summary: 'List roles (paginated, filterable)' })
  async listRoles(@Query() query: ListRolesQueryDto) {
    return this.rolesService.listRoles(query);
  }

  /**
   * GET /roles/:id — Get a single role with full permissions.
   */
  @Get(':id')
  @Permissions('roles:read')
  @ApiOperation({ summary: 'Get role by ID with permissions' })
  async getRoleById(@Param('id') id: string) {
    return this.rolesService.getRoleById(id);
  }

  /**
   * POST /roles — Create a new role.
   */
  @Post()
  @Permissions('roles:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role' })
  async createRole(
    @Body() dto: CreateRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.createRole(dto, user.sub);
  }

  /**
   * PATCH /roles/:id — Update role mutable fields.
   */
  @Patch(':id')
  @Permissions('roles:write')
  @ApiOperation({ summary: 'Update a role' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.updateRole(id, dto, user.sub);
  }

  /**
   * DELETE /roles/:id — Soft-delete a role.
   */
  @Delete(':id')
  @Permissions('roles:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a role' })
  async deleteRole(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.deleteRole(id, user.sub);
  }
}
