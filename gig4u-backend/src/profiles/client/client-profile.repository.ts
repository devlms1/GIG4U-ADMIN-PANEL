import { Injectable } from '@nestjs/common';
import { ClientRole, UserType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';

const CLIENT_WITH_USER_AND_TENANT = {
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
  tenant: true,
} as const;

@Injectable()
export class ClientProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a client profile by userId with user and tenant info.
   */
  async findByUserId(userId: string) {
    return this.prisma.clientProfile.findUnique({
      where: { userId },
      include: CLIENT_WITH_USER_AND_TENANT,
    });
  }

  /**
   * Update a client profile.
   */
  async update(userId: string, dto: UpdateClientProfileDto) {
    return this.prisma.clientProfile.update({
      where: { userId },
      data: dto,
      include: CLIENT_WITH_USER_AND_TENANT,
    });
  }

  /**
   * Find all client profiles belonging to a tenant (team members).
   */
  async findTeamByTenantId(tenantId: string) {
    return this.prisma.clientProfile.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Creates a new team member user within a tenant inside a transaction.
   * Creates user + client_profile + assigns the matching role.
   */
  async createTeamMember(data: {
    phone: string;
    email: string;
    tenantId: string;
    clientRole: ClientRole;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: data.phone,
          email: data.email,
          userType: UserType.CLIENT,
        },
      });

      const profile = await tx.clientProfile.create({
        data: {
          userId: user.id,
          tenantId: data.tenantId,
          clientRole: data.clientRole,
        },
      });

      const roleNameMap: Record<ClientRole, string> = {
        [ClientRole.ADMIN]: 'CLIENT_ADMIN',
        [ClientRole.MANAGER]: 'CLIENT_MANAGER',
        [ClientRole.FINANCE]: 'CLIENT_FINANCE',
        [ClientRole.VIEWER]: 'CLIENT_VIEWER',
      };

      const role = await tx.role.findUnique({
        where: { name: roleNameMap[data.clientRole] },
      });

      if (role) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
            tenantId: data.tenantId,
          },
        });
      }

      return { user, profile };
    });
  }

  /**
   * Check whether a phone number is already registered.
   */
  async phoneExists(phone: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { phone } });
    return count > 0;
  }
}
