import { PrismaService } from '../prisma/prisma.service';
export declare class PermissionsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAllGrouped(): Promise<({
        permissions: {
            id: string;
            name: string;
            displayName: string | null;
            description: string | null;
            createdAt: Date;
            groupId: string | null;
            isActive: boolean;
        }[];
    } & {
        id: string;
        name: string;
        displayName: string | null;
        description: string | null;
        createdAt: Date;
    })[]>;
    roleExists(roleId: string): Promise<boolean>;
    userExists(userId: string): Promise<boolean>;
    permissionsExist(ids: string[]): Promise<boolean>;
    assignPermissionsToRole(roleId: string, permissionIds: string[], grantedById?: string): Promise<number>;
    revokePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<number>;
    assignRoleToUser(data: {
        userId: string;
        roleId: string;
        tenantId?: string;
        expiresAt?: Date;
        assignedById?: string;
    }): Promise<{
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
    }>;
    deactivateUserRole(userId: string, roleId: string): Promise<number>;
    userRoleExists(userId: string, roleId: string, tenantId?: string): Promise<boolean>;
}
