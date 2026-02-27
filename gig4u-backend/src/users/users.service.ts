import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { ListUsersQueryDto, UpdateUserStatusDto, CreateAdminDto } from './dto';
import { AuditService } from '../audit/audit.service';
import { createPaginationMeta } from '../common/utils';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Returns a paginated list of users with profile summaries.
   */
  async listUsers(query: ListUsersQueryDto) {
    const { items, total, page, limit } = await this.usersRepo.findAll(query);

    return {
      data: { items, meta: createPaginationMeta(total, page, limit) },
      message: 'Users retrieved',
    };
  }

  /**
   * Returns a single user with full profile, roles, and permissions.
   */
  async getUserById(id: string) {
    const user = await this.usersRepo.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash: _, ...sanitised } = user;
    return { data: sanitised, message: 'User retrieved' };
  }

  /**
   * Updates a user's status and logs the change to audit.
   */
  async updateUserStatus(
    id: string,
    dto: UpdateUserStatusDto,
    actorUserId: string,
  ) {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousStatus = user.status;
    const updated = await this.usersRepo.updateStatus(id, dto.status);

    await this.auditService.log({
      actorUserId,
      action: 'USER_STATUS_CHANGED',
      targetType: 'User',
      targetId: id,
      metadata: {
        previousStatus,
        newStatus: dto.status,
        reason: dto.reason,
      },
    });

    return { data: updated, message: `User status changed to ${dto.status}` };
  }

  /**
   * Creates a new admin user with admin_profile. Does NOT assign any role.
   */
  async createAdmin(dto: CreateAdminDto, actorUserId: string) {
    const exists = await this.usersRepo.phoneExists(dto.phone);
    if (exists) {
      throw new ConflictException('Phone number is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersRepo.createAdminUser({
      phone: dto.phone,
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      employeeId: dto.employeeId,
      department: dto.department,
    });

    await this.auditService.log({
      actorUserId,
      action: 'ADMIN_USER_CREATED',
      targetType: 'User',
      targetId: (user as unknown as { id: string }).id,
      metadata: { phone: dto.phone, fullName: dto.fullName },
    });

    return { data: user, message: 'Admin user created' };
  }

  /**
   * Returns platform stats for the admin dashboard.
   */
  async getStats() {
    const counts = await this.usersRepo.countByType();
    const pendingKyc = await this.usersRepo.countPendingKyc();

    return {
      data: {
        ...counts,
        pendingKyc,
        activeProjects: 0,
      },
      message: 'Stats retrieved',
    };
  }
}
