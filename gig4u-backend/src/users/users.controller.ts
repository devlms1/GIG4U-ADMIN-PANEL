import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { UsersService } from './users.service';
import { ListUsersQueryDto, UpdateUserStatusDto, CreateAdminDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { JwtPayload } from '../common/types';

@ApiTags('Admin - Users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserType.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /admin/users — Paginated user list with filters.
   */
  @Get()
  @Permissions('users:list')
  @ApiOperation({ summary: 'List all users (admin)' })
  async listUsers(@Query() query: ListUsersQueryDto) {
    return this.usersService.listUsers(query);
  }

  /**
   * GET /admin/users/:id — Full user detail with profile + roles.
   */
  @Get(':id')
  @Permissions('users:view')
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  /**
   * PATCH /admin/users/:id/status — Change user status.
   */
  @Patch(':id/status')
  @Permissions('users:ban')
  @ApiOperation({ summary: 'Update user status (ban/suspend/activate)' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.usersService.updateUserStatus(id, dto, actor.sub);
  }

  /**
   * POST /admin/users/create-admin — Create a new admin user.
   */
  @Post('create-admin')
  @Permissions('users:create_admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create admin user' })
  async createAdmin(
    @Body() dto: CreateAdminDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.usersService.createAdmin(dto, actor.sub);
  }
}
