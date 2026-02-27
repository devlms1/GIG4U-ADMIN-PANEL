import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, ListRolesQueryDto } from './dto';
import type { JwtPayload } from '../common/types';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    listRoles(query: ListRolesQueryDto): Promise<{
        data: {
            items: ({
                parent: {
                    id: string;
                    name: string;
                    displayName: string | null;
                } | null;
                _count: {
                    rolePermissions: number;
                    userRoles: number;
                };
            } & {
                id: string;
                name: string;
                displayName: string | null;
                description: string | null;
                createdAt: Date;
                isActive: boolean;
                actorType: import(".prisma/client").$Enums.UserType;
                parentId: string | null;
                isSystem: boolean;
                createdById: string | null;
                updatedAt: Date;
                deletedAt: Date | null;
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
    getRoleById(id: string): Promise<{
        data: {
            rolePermissions: ({
                permission: {
                    group: {
                        id: string;
                        name: string;
                        displayName: string | null;
                        description: string | null;
                        createdAt: Date;
                    } | null;
                } & {
                    id: string;
                    name: string;
                    displayName: string | null;
                    description: string | null;
                    createdAt: Date;
                    groupId: string | null;
                    isActive: boolean;
                };
            } & {
                roleId: string;
                permissionId: string;
                grantedById: string | null;
                grantedAt: Date;
            })[];
            parent: {
                id: string;
                name: string;
                displayName: string | null;
            } | null;
            children: {
                id: string;
                name: string;
                displayName: string | null;
            }[];
            _count: {
                userRoles: number;
            };
        } & {
            id: string;
            name: string;
            displayName: string | null;
            description: string | null;
            createdAt: Date;
            isActive: boolean;
            actorType: import(".prisma/client").$Enums.UserType;
            parentId: string | null;
            isSystem: boolean;
            createdById: string | null;
            updatedAt: Date;
            deletedAt: Date | null;
        };
        message: string;
    }>;
    createRole(dto: CreateRoleDto, user: JwtPayload): Promise<{
        data: {
            parent: {
                id: string;
                name: string;
                displayName: string | null;
            } | null;
        } & {
            id: string;
            name: string;
            displayName: string | null;
            description: string | null;
            createdAt: Date;
            isActive: boolean;
            actorType: import(".prisma/client").$Enums.UserType;
            parentId: string | null;
            isSystem: boolean;
            createdById: string | null;
            updatedAt: Date;
            deletedAt: Date | null;
        };
        message: string;
    }>;
    updateRole(id: string, dto: UpdateRoleDto, user: JwtPayload): Promise<{
        data: {
            _count: {
                rolePermissions: number;
                userRoles: number;
            };
        } & {
            id: string;
            name: string;
            displayName: string | null;
            description: string | null;
            createdAt: Date;
            isActive: boolean;
            actorType: import(".prisma/client").$Enums.UserType;
            parentId: string | null;
            isSystem: boolean;
            createdById: string | null;
            updatedAt: Date;
            deletedAt: Date | null;
        };
        message: string;
    }>;
    deleteRole(id: string, user: JwtPayload): Promise<{
        data: null;
        message: string;
    }>;
}
