import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserType, UserStatus } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import { SignupDto, LoginDto, SelectRoleDto, RefreshTokenDto } from './dto';
import { JwtPayload, TempTokenPayload } from '../common/types';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Signup ─────────────────────────────────────────────────────────────

  /**
   * Registers a new CLIENT or SP user.
   * ADMIN signup is blocked — admins are created by Super Admin only.
   */
  async signup(dto: SignupDto) {
    if (dto.userType === UserType.ADMIN) {
      throw new ForbiddenException(
        'Admin accounts cannot be created via public signup',
      );
    }

    const exists = await this.authRepo.phoneExists(dto.phone);
    if (exists) {
      throw new ConflictException('Phone number is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    let user;
    if (dto.userType === UserType.CLIENT) {
      user = await this.authRepo.createClientUser({
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        companyName: dto.companyName!,
      });
    } else {
      user = await this.authRepo.createSpUser({
        phone: dto.phone,
        email: dto.email,
        passwordHash,
      });
    }

    const { roles, permissions, tenantId } =
      this.extractRolesAndPermissions(user);
    const tokens = await this.issueTokenPair(
      user.id,
      user.userType,
      roles,
      permissions,
      tenantId,
    );

    return {
      data: {
        user: this.sanitiseUser(user),
        ...tokens,
      },
      message: 'Account created successfully',
    };
  }

  // ─── Login ──────────────────────────────────────────────────────────────

  /**
   * Authenticates a user by phone + password.
   * For ADMIN users with multiple roles, returns a tempToken for role selection.
   */
  async login(dto: LoginDto) {
    const user = await this.authRepo.findUserByPhone(dto.phone);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    if (
      user.status === UserStatus.BANNED ||
      user.status === UserStatus.SUSPENDED
    ) {
      throw new ForbiddenException(
        `Your account is ${user.status.toLowerCase()}`,
      );
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    await this.authRepo.updateLastLogin(user.id);

    // Admin multi-role flow
    if (user.userType === UserType.ADMIN) {
      const adminRoles = await this.authRepo.findAdminRolesForUser(user.id);

      if (adminRoles.length === 0) {
        throw new ForbiddenException('No admin roles assigned');
      }

      if (adminRoles.length === 1) {
        const selectedRole = adminRoles[0].role;
        const permissions = selectedRole.rolePermissions.map(
          (rp) => rp.permission.name,
        );

        const jti = crypto.randomUUID();
        const tokens = await this.issueTokenPair(
          user.id,
          UserType.ADMIN,
          [selectedRole.name],
          permissions,
          null,
          jti,
        );

        const accessExpiry = this.configService.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
          '15m',
        );
        await this.authRepo.createAdminSession({
          userId: user.id,
          selectedRoleId: selectedRole.id,
          jwtJti: jti,
          expiresAt: this.parseExpiryToDate(accessExpiry),
        });

        return {
          data: {
            user: this.sanitiseUser(user),
            ...tokens,
            selectedRole: {
              id: selectedRole.id,
              name: selectedRole.name,
              displayName: selectedRole.displayName,
            },
          },
          message: 'Login successful',
        };
      }

      // Multiple admin roles — issue short-lived temp token
      const tempToken = this.jwtService.sign(
        { sub: user.id, purpose: 'role_selection' },
        {
          secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
          expiresIn: '5m',
        },
      );

      return {
        data: {
          requiresRoleSelection: true,
          availableRoles: adminRoles.map((ur) => ({
            id: ur.role.id,
            name: ur.role.name,
            displayName: ur.role.displayName,
          })),
          tempToken,
        },
        message: 'Select a role to continue',
      };
    }

    // CLIENT / SP standard flow
    const { roles, permissions, tenantId } =
      this.extractRolesAndPermissions(user);
    const tokens = await this.issueTokenPair(
      user.id,
      user.userType,
      roles,
      permissions,
      tenantId,
    );

    return {
      data: {
        user: this.sanitiseUser(user),
        ...tokens,
      },
      message: 'Login successful',
    };
  }

  // ─── Admin Role Selection ───────────────────────────────────────────────

  /**
   * Completes admin login by selecting a specific role from the available set.
   * Requires a valid tempToken issued during login.
   */
  async selectRole(dto: SelectRoleDto, tempToken: string) {
    let payload: TempTokenPayload;
    try {
      payload = this.jwtService.verify<TempTokenPayload>(tempToken, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        'Role selection token is invalid or expired',
      );
    }

    if (payload.purpose !== 'role_selection') {
      throw new UnauthorizedException('Invalid token purpose');
    }

    const userId = payload.sub;
    const hasRole = await this.authRepo.userHasRole(userId, dto.roleId);
    if (!hasRole) {
      throw new ForbiddenException('This role is not assigned to you');
    }

    const role = await this.authRepo.findRoleById(dto.roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissions = role.rolePermissions.map((rp) => rp.permission.name);
    const jti = crypto.randomUUID();

    const tokens = await this.issueTokenPair(
      userId,
      UserType.ADMIN,
      [role.name],
      permissions,
      null,
      jti,
    );

    const accessExpiry = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    );
    await this.authRepo.createAdminSession({
      userId,
      selectedRoleId: role.id,
      jwtJti: jti,
      expiresAt: this.parseExpiryToDate(accessExpiry),
    });

    return {
      data: {
        ...tokens,
        selectedRole: {
          id: role.id,
          name: role.name,
          displayName: role.displayName,
        },
      },
      message: 'Role selected successfully',
    };
  }

  // ─── Refresh ────────────────────────────────────────────────────────────

  /**
   * Rotates the refresh token: revokes the old one and issues a new pair.
   */
  async refresh(dto: RefreshTokenDto) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const tokenHash = this.hashToken(dto.refreshToken);
    const storedToken = await this.authRepo.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found or revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke old, issue new
    await this.authRepo.revokeRefreshToken(storedToken.id);

    const tokens = await this.issueTokenPair(
      payload.sub,
      payload.userType,
      payload.roles,
      payload.permissions,
      payload.tenantId,
      payload.jti,
    );

    return {
      data: tokens,
      message: 'Tokens refreshed successfully',
    };
  }

  // ─── Logout ─────────────────────────────────────────────────────────────

  /**
   * Revokes all refresh tokens for the current user.
   * Terminates admin sessions if applicable.
   */
  async logout(currentUser: JwtPayload) {
    await this.authRepo.revokeAllUserRefreshTokens(currentUser.sub);

    if (currentUser.userType === UserType.ADMIN) {
      await this.authRepo.terminateAdminSessions(currentUser.sub);
    }

    return {
      data: null,
      message: 'Logged out successfully',
    };
  }

  // ─── Me ─────────────────────────────────────────────────────────────────

  /**
   * Returns the current user's profile, roles, and permissions.
   */
  async getMe(currentUser: JwtPayload) {
    const user = await this.authRepo.findUserById(currentUser.sub);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { roles, permissions, tenantId } =
      this.extractRolesAndPermissions(user);

    return {
      data: {
        ...this.sanitiseUser(user),
        roles,
        permissions,
        tenantId,
      },
      message: 'Profile retrieved',
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  /**
   * Issues a new access + refresh token pair and persists the refresh token hash.
   */
  private async issueTokenPair(
    userId: string,
    userType: UserType,
    roles: string[],
    permissions: string[],
    tenantId: string | null,
    jti?: string,
  ) {
    const accessPayload = {
      sub: userId,
      userType,
      roles,
      permissions,
      tenantId,
      ...(jti && { jti }),
    };

    const refreshPayload = {
      sub: userId,
      userType,
      roles,
      permissions,
      tenantId,
      jti: crypto.randomUUID(),
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const refreshExpiry = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    await this.authRepo.createRefreshToken({
      userId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: this.parseExpiryToDate(refreshExpiry),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Extracts role names, permission names, and tenantId from a user with
   * eager-loaded userRoles → role → rolePermissions → permission.
   */
  private extractRolesAndPermissions(user: {
    userRoles: Array<{
      role: {
        name: string;
        rolePermissions: Array<{ permission: { name: string } }>;
      };
      tenantId: string | null;
    }>;
  }) {
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.name),
        ),
      ),
    ];
    const tenantId = user.userRoles.find((ur) => ur.tenantId)?.tenantId ?? null;

    return { roles, permissions, tenantId };
  }

  /**
   * Strips sensitive fields (passwordHash) from a user record for API responses.
   */
  private sanitiseUser(user: {
    id: string;
    phone: string;
    email: string | null;
    userType: UserType;
    status: string;
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    clientProfile?: unknown;
    spProfile?: unknown;
    adminProfile?: unknown;
  }) {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      userType: user.userType,
      status: user.status,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      profile: user.clientProfile ?? user.spProfile ?? user.adminProfile ?? null,
    };
  }

  /** SHA-256 hash of a token string for safe database storage. */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** Converts a duration string like '15m' or '7d' to an absolute Date. */
  private parseExpiryToDate(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 15 * 60 * 1000); // fallback 15 min
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + value * multipliers[unit]);
  }
}
