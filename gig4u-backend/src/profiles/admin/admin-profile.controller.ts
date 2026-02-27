import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { AdminProfileService } from './admin-profile.service';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/types';

@ApiTags('Admin Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.ADMIN)
@Controller('admin/profile')
export class AdminProfileController {
  constructor(private readonly adminProfileService: AdminProfileService) {}

  /**
   * GET /admin/profile — Admin views own profile with active role.
   */
  @Get()
  @ApiOperation({ summary: 'Get own admin profile' })
  async getOwnProfile(@CurrentUser() user: JwtPayload) {
    return this.adminProfileService.getOwnProfile(user.sub);
  }

  /**
   * PATCH /admin/profile — Admin updates own profile fields.
   */
  @Patch()
  @ApiOperation({ summary: 'Update own admin profile' })
  async updateOwnProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAdminProfileDto,
  ) {
    return this.adminProfileService.updateOwnProfile(user.sub, dto);
  }
}
