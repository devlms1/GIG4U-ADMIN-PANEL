import { RolesRepository } from './roles.repository';
import { CreateRoleDto, UpdateRoleDto, ListRolesQueryDto } from './dto';
import { AuditService } from '../audit/audit.service';
export declare class RolesService {
    private readonly rolesRepo;
    private readonly auditService;
    constructor(rolesRepo: RolesRepository, auditService: AuditService);
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
    createRole(dto: CreateRoleDto, actorUserId: string): Promise<{
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
    updateRole(id: string, dto: UpdateRoleDto, actorUserId: string): Promise<{
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
    deleteRole(id: string, actorUserId: string): Promise<{
        data: null;
        message: string;
    }>;
}
