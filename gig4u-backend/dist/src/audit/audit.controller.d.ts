import { AuditRepository } from './audit.repository';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
export declare class AuditController {
    private readonly auditRepo;
    constructor(auditRepo: AuditRepository);
    listAuditLogs(query: ListAuditLogsQueryDto): Promise<{
        data: {
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
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                actorUserId: string | null;
            })[];
            meta: {
                total: number;
                page: number;
                limit: number;
                totalPages: number;
                hasNextPage: boolean;
                hasPreviousPage: boolean;
            };
        };
        message: string;
    }>;
}
