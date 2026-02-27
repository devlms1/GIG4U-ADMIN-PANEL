import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

const ADMIN_WITH_USER_AND_ROLE = {
  user: {
    select: {
      id: true,
      phone: true,
      email: true,
      userType: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
  },
  activeRole: {
    select: {
      id: true,
      name: true,
      displayName: true,
    },
  },
} as const;

@Injectable()
export class AdminProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find an admin profile by userId with user and active role info.
   */
  async findByUserId(userId: string) {
    return this.prisma.adminProfile.findUnique({
      where: { userId },
      include: ADMIN_WITH_USER_AND_ROLE,
    });
  }

  /**
   * Update an admin profile.
   */
  async update(userId: string, dto: UpdateAdminProfileDto) {
    return this.prisma.adminProfile.update({
      where: { userId },
      data: dto,
      include: ADMIN_WITH_USER_AND_ROLE,
    });
  }
}
