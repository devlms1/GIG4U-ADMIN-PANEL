import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ClientRole } from '@prisma/client';
import { ClientProfileRepository } from './client-profile.repository';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import type { JwtPayload } from '../../common/types';

@Injectable()
export class ClientProfileService {
  constructor(private readonly clientProfileRepo: ClientProfileRepository) {}

  /**
   * Returns the authenticated client user's own profile with tenant info.
   */
  async getOwnProfile(userId: string) {
    const profile = await this.clientProfileRepo.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException('Client profile not found');
    }

    return { data: profile, message: 'Profile retrieved' };
  }

  /**
   * Updates the authenticated client user's profile fields.
   */
  async updateOwnProfile(userId: string, dto: UpdateClientProfileDto) {
    const existing = await this.clientProfileRepo.findByUserId(userId);

    if (!existing) {
      throw new NotFoundException('Client profile not found');
    }

    const updated = await this.clientProfileRepo.update(userId, dto);
    return { data: updated, message: 'Profile updated successfully' };
  }

  /**
   * Returns all team members belonging to the same tenant.
   * Only callable by users with clientRole = ADMIN.
   */
  async getTeam(currentUser: JwtPayload) {
    const profile = await this.clientProfileRepo.findByUserId(currentUser.sub);

    if (!profile) {
      throw new NotFoundException('Client profile not found');
    }

    if (profile.clientRole !== ClientRole.ADMIN) {
      throw new ForbiddenException('Only client admins can view the team');
    }

    const team = await this.clientProfileRepo.findTeamByTenantId(
      profile.tenantId,
    );

    return { data: team, message: 'Team retrieved' };
  }

  /**
   * Invites a new team member into the same tenant.
   * Only callable by users with clientRole = ADMIN.
   */
  async inviteTeamMember(currentUser: JwtPayload, dto: InviteTeamMemberDto) {
    const profile = await this.clientProfileRepo.findByUserId(currentUser.sub);

    if (!profile) {
      throw new NotFoundException('Client profile not found');
    }

    if (profile.clientRole !== ClientRole.ADMIN) {
      throw new ForbiddenException('Only client admins can invite members');
    }

    const phoneExists = await this.clientProfileRepo.phoneExists(dto.phone);
    if (phoneExists) {
      throw new ConflictException('Phone number is already registered');
    }

    const { user, profile: newProfile } =
      await this.clientProfileRepo.createTeamMember({
        phone: dto.phone,
        email: dto.email,
        tenantId: profile.tenantId,
        clientRole: dto.clientRole,
      });

    return {
      data: { user: { id: user.id, phone: user.phone, email: user.email }, profile: newProfile },
      message: 'Team member invited successfully',
    };
  }
}
