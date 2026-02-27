import { PermissionsService } from './permissions.service';
import { AssignPermissionsDto, RevokePermissionsDto, AssignUserRoleDto } from './dto';
import type { JwtPayload } from '../common/types';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
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
    assignPermissions(roleId: string, dto: AssignPermissionsDto, user: JwtPayload): Promise<{
        data: {
            assigned: number;
            total: number;
        };
        message: string;
    }>;
    revokePermissions(roleId: string, dto: RevokePermissionsDto, user: JwtPayload): Promise<{
        data: {
            removed: number;
        };
        message: string;
    }>;
    assignRoleToUser(userId: string, dto: AssignUserRoleDto, user: JwtPayload): Promise<{
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
    revokeRoleFromUser(userId: string, roleId: string, user: JwtPayload): Promise<{
        data: null;
        message: string;
    }>;
}
