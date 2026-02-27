import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminProfileRepository } from './admin-profile.repository';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

@Injectable()
export class AdminProfileService {
  constructor(private readonly adminProfileRepo: AdminProfileRepository) {}

  /**
   * Returns the authenticated admin user's own profile with active role.
   */
  async getOwnProfile(userId: string) {
    const profile = await this.adminProfileRepo.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException('Admin profile not found');
    }

    return { data: profile, message: 'Profile retrieved' };
  }

  /**
   * Updates the authenticated admin user's profile fields.
   */
  async updateOwnProfile(userId: string, dto: UpdateAdminProfileDto) {
    const existing = await this.adminProfileRepo.findByUserId(userId);

    if (!existing) {
      throw new NotFoundException('Admin profile not found');
    }

    const updated = await this.adminProfileRepo.update(userId, dto);
    return { data: updated, message: 'Profile updated successfully' };
  }
}
