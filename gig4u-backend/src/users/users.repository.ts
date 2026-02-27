import { Injectable } from '@nestjs/common';
import { Prisma, UserType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListUsersQueryDto } from './dto';
import { calculateSkip } from '../common/utils';

const USER_SUMMARY_SELECT = {
  id: true,
  phone: true,
  email: true,
  userType: true,
  status: true,
  isPhoneVerified: true,
  isEmailVerified: true,
  lastLoginAt: true,
  createdAt: true,
  clientProfile: { select: { fullName: true, tenantId: true } },
  spProfile: { select: { fullName: true, spStatus: true } },
  adminProfile: { select: { fullName: true, employeeId: true } },
} as const;

const USER_DETAIL_INCLUDE = {
  clientProfile: { include: { tenant: true } },
  spProfile: true,
  adminProfile: { include: { activeRole: true } },
  userRoles: {
    where: { isActive: true },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  },
} as const;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Paginated user list with filters and profile summary.
   */
  async findAll(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 15;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.userType && { userType: query.userType }),
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { phone: { contains: query.search } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SUMMARY_SELECT,
        skip: calculateSkip(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  /**
   * Full user detail by ID with profiles, roles, and permissions.
   */
  async findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: USER_DETAIL_INCLUDE,
    });
  }

  /**
   * Update user status.
   */
  async updateStatus(id: string, status: Prisma.EnumUserStatusFieldUpdateOperationsInput['set']) {
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: USER_SUMMARY_SELECT,
    });
  }

  /**
   * Check phone uniqueness.
   */
  async phoneExists(phone: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { phone } });
    return count > 0;
  }

  /**
   * Create an admin user with admin_profile in a transaction.
   */
  async createAdminUser(data: {
    phone: string;
    email?: string;
    passwordHash: string;
    fullName: string;
    employeeId?: string;
    department?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: data.phone,
          email: data.email,
          passwordHash: data.passwordHash,
          userType: UserType.ADMIN,
        },
      });

      await tx.adminProfile.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
          employeeId: data.employeeId,
          department: data.department,
        },
      });

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        select: USER_SUMMARY_SELECT,
      });
    });
  }

  // ─── Stats ──────────────────────────────────────────────────────────────

  /**
   * Count users by type.
   */
  async countByType() {
    const [totalUsers, clientCount, spCount, adminCount] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { userType: UserType.CLIENT, deletedAt: null } }),
      this.prisma.user.count({ where: { userType: UserType.SP, deletedAt: null } }),
      this.prisma.user.count({ where: { userType: UserType.ADMIN, deletedAt: null } }),
    ]);
    return { totalUsers, clientCount, spCount, adminCount };
  }

  /**
   * Count SPs with KYC pending.
   */
  async countPendingKyc(): Promise<number> {
    return this.prisma.spProfile.count({
      where: { spStatus: { in: ['KYC_PENDING', 'KYC_SUBMITTED'] } },
    });
  }
}
