import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(params: {
        actorUserId?: string;
        actorRole?: string;
        action: string;
        targetType?: string;
        targetId?: string;
        metadata?: Record<string, unknown>;
        ipAddress?: string;
    }): Promise<void>;
}
