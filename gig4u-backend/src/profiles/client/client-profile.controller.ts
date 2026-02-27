import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { ClientProfileService } from './client-profile.service';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/types';

@ApiTags('Client Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.CLIENT)
@Controller('client')
export class ClientProfileController {
  constructor(private readonly clientProfileService: ClientProfileService) {}

  /**
   * GET /client/profile — Client views own profile.
   */
  @Get('profile')
  @ApiOperation({ summary: 'Get own client profile' })
  async getOwnProfile(@CurrentUser() user: JwtPayload) {
    return this.clientProfileService.getOwnProfile(user.sub);
  }

  /**
   * PATCH /client/profile — Client updates own profile fields.
   */
  @Patch('profile')
  @ApiOperation({ summary: 'Update own client profile' })
  async updateOwnProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateClientProfileDto,
  ) {
    return this.clientProfileService.updateOwnProfile(user.sub, dto);
  }

  /**
   * GET /client/team — Client admin views all team members in tenant.
   */
  @Get('team')
  @ApiOperation({ summary: 'Get team members (client admin only)' })
  async getTeam(@CurrentUser() user: JwtPayload) {
    return this.clientProfileService.getTeam(user);
  }

  /**
   * POST /client/team/invite — Client admin invites a new team member.
   */
  @Post('team/invite')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a team member (client admin only)' })
  async inviteTeamMember(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InviteTeamMemberDto,
  ) {
    return this.clientProfileService.inviteTeamMember(user, dto);
  }
}
