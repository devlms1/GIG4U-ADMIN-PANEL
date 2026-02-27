import { Injectable, NotFoundException } from '@nestjs/common';
import { SpProfileRepository } from './sp-profile.repository';
import { UpdateSpProfileDto } from './dto/update-sp-profile.dto';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class SpProfileService {
  constructor(
    private readonly spProfileRepo: SpProfileRepository,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Returns the authenticated SP user's own profile.
   */
  async getOwnProfile(userId: string) {
    const profile = await this.spProfileRepo.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException('SP profile not found');
    }

    return { data: profile, message: 'Profile retrieved' };
  }

  /**
   * Updates the authenticated SP user's profile fields.
   * Writes an audit log entry on success.
   */
  async updateOwnProfile(userId: string, dto: UpdateSpProfileDto) {
    const existing = await this.spProfileRepo.findByUserId(userId);

    if (!existing) {
      throw new NotFoundException('SP profile not found');
    }

    const updated = await this.spProfileRepo.update(userId, dto);

    await this.auditService.log({
      actorUserId: userId,
      action: 'SP_PROFILE_UPDATED',
      targetType: 'SpProfile',
      targetId: userId,
      metadata: { updatedFields: Object.keys(dto) },
    });

    return { data: updated, message: 'Profile updated successfully' };
  }

  /**
   * Admin: retrieves any SP profile by user ID, including roles and KYC status.
   */
  async getProfileById(userId: string) {
    const profile = await this.spProfileRepo.findByUserIdWithRoles(userId);

    if (!profile) {
      throw new NotFoundException('SP profile not found');
    }

    return { data: profile, message: 'Profile retrieved' };
  }
}
