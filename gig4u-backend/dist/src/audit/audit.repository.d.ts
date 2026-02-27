import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
export declare class AuditRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query: ListAuditLogsQueryDto): Promise<{
        items: ({
            actorUser: {
                id: string;
                phone: string;
                email: string | null;
                userType: import(".prisma/client").$Enums.UserType;
                adminProfile: {
                    fullName: string | null;
                } | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            ipAddress: string | null;
            actorRole: string | null;
            action: string;
            targetType: string | null;
            targetId: string | null;
            metadata: Prisma.JsonValue | null;
            actorUserId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
}
