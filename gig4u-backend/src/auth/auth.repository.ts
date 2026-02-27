import { Injectable } from '@nestjs/common';
import { Prisma, User, UserType, RefreshToken } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Include clause shared across auth queries that need profile + roles + permissions. */
const USER_WITH_PROFILE_AND_ROLES = {
  clientProfile: { include: { tenant: true } },
  spProfile: true,
  adminProfile: true,
  userRoles: {
    where: { isActive: true },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  },
} as const;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── User Queries ───────────────────────────────────────────────────────

  /**
   * Find a non-deleted user by phone with full profile, roles, and permissions.
   */
  async findUserByPhone(phone: string) {
    return this.prisma.user.findFirst({
      where: { phone, deletedAt: null },
      include: USER_WITH_PROFILE_AND_ROLES,
    });
  }

  /**
   * Find a non-deleted user by ID with full profile, roles, and permissions.
   */
  async findUserById(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: USER_WITH_PROFILE_AND_ROLES,
    });
  }

  /**
   * Check whether a phone number is already registered.
   */
  async phoneExists(phone: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { phone } });
    return count > 0;
  }

  /**
   * Update the lastLoginAt timestamp for a user.
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  // ─── Signup Transaction ─────────────────────────────────────────────────

  /**
   * Creates a CLIENT user inside a transaction:
   * user + tenant + client_profile + CLIENT_ADMIN user_role.
   */
  async createClientUser(data: {
    phone: string;
    email?: string;
    passwordHash: string;
    companyName: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: data.phone,
          email: data.email,
          passwordHash: data.passwordHash,
          userType: UserType.CLIENT,
        },
      });

      const tenant = await tx.tenant.create({
        data: { companyName: data.companyName },
      });

      await tx.clientProfile.create({
        data: { userId: user.id, tenantId: tenant.id },
      });

      const clientAdminRole = await tx.role.findUnique({
        where: { name: 'CLIENT_ADMIN' },
      });

      if (clientAdminRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: clientAdminRole.id,
            tenantId: tenant.id,
          },
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: USER_WITH_PROFILE_AND_ROLES,
      });
    });
  }

  /**
   * Creates an SP user inside a transaction:
   * user + sp_profile + SP_BASIC user_role.
   */
  async createSpUser(data: {
    phone: string;
    email?: string;
    passwordHash: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: data.phone,
          email: data.email,
          passwordHash: data.passwordHash,
          userType: UserType.SP,
        },
      });

      await tx.spProfile.create({ data: { userId: user.id } });

      const spRole = await tx.role.findUnique({
        where: { name: 'SP_BASIC' },
      });

      if (spRole) {
        await tx.userRole.create({
          data: { userId: user.id, roleId: spRole.id },
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: USER_WITH_PROFILE_AND_ROLES,
      });
    });
  }

  // ─── Refresh Token ──────────────────────────────────────────────────────

  /**
   * Store a hashed refresh token in the database.
   */
  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
  }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  /**
   * Find a refresh token by its hash, ensuring it is not revoked.
   */
  async findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
    });
  }

  /**
   * Revoke a single refresh token by its ID.
   */
  async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all active refresh tokens for a user.
   */
  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ─── Admin Roles & Sessions ─────────────────────────────────────────────

  /**
   * Get all active ADMIN-type roles assigned to a user.
   */
  async findAdminRolesForUser(userId: string) {
    return this.prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        role: { actorType: UserType.ADMIN, isActive: true, deletedAt: null },
      },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });
  }

  /**
   * Verify that a specific role is assigned to a user and active.
   */
  async userHasRole(userId: string, roleId: string): Promise<boolean> {
    const count = await this.prisma.userRole.count({
      where: { userId, roleId, isActive: true },
    });
    return count > 0;
  }

  /**
   * Get all permissions for a given role.
   */
  async findPermissionsForRole(roleId: string): Promise<string[]> {
    const rolePerms = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    return rolePerms.map((rp) => rp.permission.name);
  }

  /**
   * Create an admin session record (jti binding).
   */
  async createAdminSession(data: {
    userId: string;
    selectedRoleId: string;
    jwtJti: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.adminSession.create({ data });
  }

  /**
   * Terminate an admin session by user ID (latest active session).
   */
  async terminateAdminSessions(userId: string): Promise<void> {
    await this.prisma.adminSession.updateMany({
      where: { userId, terminatedAt: null },
      data: { terminatedAt: new Date() },
    });
  }

  /**
   * Find a role by its ID with permissions.
   */
  async findRoleById(roleId: string) {
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });
  }
}
