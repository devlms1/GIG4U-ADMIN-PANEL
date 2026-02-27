import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ListRolesQueryDto } from './dto/list-roles-query.dto';
export declare class RolesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query: ListRolesQueryDto): Promise<{
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
        total: number;
        page: number;
        limit: number;
    }>;
    findById(id: string): Promise<({
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
    }) | null>;
    findByName(name: string): Promise<{
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
    } | null>;
    create(dto: CreateRoleDto, createdById?: string): Promise<{
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
    }>;
    update(id: string, dto: UpdateRoleDto): Promise<{
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
    }>;
    softDelete(id: string): Promise<{
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
    }>;
    countActiveAssignments(roleId: string): Promise<number>;
}
