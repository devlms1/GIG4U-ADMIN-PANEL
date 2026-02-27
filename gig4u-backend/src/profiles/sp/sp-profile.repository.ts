import { Injectable } from '@nestjs/common';
import { SpStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSpProfileDto } from './dto/update-sp-profile.dto';

const SP_WITH_USER = {
  user: {
    select: {
      id: true,
      phone: true,
      email: true,
      userType: true,
      status: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      lastLoginAt: true,
      createdAt: true,
    },
  },
} as const;

const SP_WITH_USER_AND_ROLES = {
  user: {
    select: {
      id: true,
      phone: true,
      email: true,
      userType: true,
      status: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      lastLoginAt: true,
      createdAt: true,
      userRoles: {
        where: { isActive: true },
        include: { role: true },
      },
    },
  },
} as const;

@Injectable()
export class SpProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find an SP profile by userId with user info.
   */
  async findByUserId(userId: string) {
    return this.prisma.spProfile.findUnique({
      where: { userId },
      include: SP_WITH_USER,
    });
  }

  /**
   * Find an SP profile by userId with user info + roles (admin view).
   */
  async findByUserIdWithRoles(userId: string) {
    return this.prisma.spProfile.findUnique({
      where: { userId },
      include: SP_WITH_USER_AND_ROLES,
    });
  }

  /**
   * Update an SP profile and conditionally advance status to KYC_PENDING.
   */
  async update(userId: string, dto: UpdateSpProfileDto) {
    const data: Record<string, unknown> = { ...dto };

    if (dto.dateOfBirth) {
      data.dateOfBirth = new Date(dto.dateOfBirth);
    }

    const updated = await this.prisma.spProfile.update({
      where: { userId },
      data,
      include: SP_WITH_USER,
    });

    // Auto-advance to KYC_PENDING when all required fields are filled
    if (
      updated.spStatus === SpStatus.PROFILE_INCOMPLETE &&
      updated.fullName &&
      updated.city &&
      updated.state &&
      updated.pincode &&
      updated.gender &&
      updated.dateOfBirth
    ) {
      return this.prisma.spProfile.update({
        where: { userId },
        data: { spStatus: SpStatus.KYC_PENDING },
        include: SP_WITH_USER,
      });
    }

    return updated;
  }
}
