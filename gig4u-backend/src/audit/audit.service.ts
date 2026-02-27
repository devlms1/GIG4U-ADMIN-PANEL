import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Writes an audit log entry. Fire-and-forget — never throws to the caller.
   */
  async log(params: {
    actorUserId?: string;
    actorRole?: string;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<void> {
    try {
      const data: Prisma.AuditLogUncheckedCreateInput = {
        action: params.action,
        actorUserId: params.actorUserId,
        actorRole: params.actorRole,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata
          ? (params.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ipAddress: params.ipAddress,
      };

      await this.prisma.auditLog.create({ data });
    } catch (error) {
      this.logger.error('Failed to write audit log', error);
    }
  }
}
