import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { SpProfileService } from './sp-profile.service';
import { UpdateSpProfileDto } from './dto/update-sp-profile.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/types';

@ApiTags('SP Profile')
@ApiBearerAuth()
@Controller('sp/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpProfileController {
  constructor(private readonly spProfileService: SpProfileService) {}

  /**
   * GET /sp/profile — SP views own profile.
   */
  @Get()
  @Roles(UserType.SP)
  @ApiOperation({ summary: 'Get own SP profile' })
  async getOwnProfile(@CurrentUser() user: JwtPayload) {
    return this.spProfileService.getOwnProfile(user.sub);
  }

  /**
   * PATCH /sp/profile — SP updates own profile fields.
   */
  @Patch()
  @Roles(UserType.SP)
  @ApiOperation({ summary: 'Update own SP profile' })
  async updateOwnProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSpProfileDto,
  ) {
    return this.spProfileService.updateOwnProfile(user.sub, dto);
  }

  /**
   * GET /sp/profile/:id — Admin views any SP profile.
   */
  @Get(':id')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Admin: view SP profile by user ID' })
  async getProfileById(@Param('id') id: string) {
    return this.spProfileService.getProfileById(id);
  }
}
