import { PermissionsRepository } from './permissions.repository';
import { AssignPermissionsDto, RevokePermissionsDto, AssignUserRoleDto } from './dto';
import { AuditService } from '../audit/audit.service';
export declare class PermissionsService {
    private readonly permRepo;
    private readonly auditService;
    constructor(permRepo: PermissionsRepository, auditService: AuditService);
    listPermissions(): Promise<{
        data: {
            groups: {
                id: string;
                groupName: string;
                displayName: string | null;
                permissions: {
                    id: string;
                    name: string;
                    displayName: string | null;
                    description: string | null;
                    createdAt: Date;
                    groupId: string | null;
                    isActive: boolean;
                }[];
            }[];
        };
        message: string;
    }>;
    assignPermissionsToRole(roleId: string, dto: AssignPermissionsDto, actorUserId: string): Promise<{
        data: {
            assigned: number;
            total: number;
        };
        message: string;
    }>;
    revokePermissionsFromRole(roleId: string, dto: RevokePermissionsDto, actorUserId: string): Promise<{
        data: {
            removed: number;
        };
        message: string;
    }>;
    assignRoleToUser(userId: string, dto: AssignUserRoleDto, actorUserId: string): Promise<{
        data: {
            role: {
                id: string;
                name: string;
                displayName: string | null;
            };
        } & {
            id: string;
            isActive: boolean;
            roleId: string;
            userId: string;
            tenantId: string | null;
            assignedById: string | null;
            assignedAt: Date;
            expiresAt: Date | null;
        };
        message: string;
    }>;
    revokeRoleFromUser(userId: string, roleId: string, actorUserId: string): Promise<{
        data: null;
        message: string;
    }>;
}
