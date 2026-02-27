import { UsersService } from './users.service';
import { ListUsersQueryDto, UpdateUserStatusDto, CreateAdminDto } from './dto';
import type { JwtPayload } from '../common/types';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    listUsers(query: ListUsersQueryDto): Promise<{
        data: {
            items: {
                id: string;
                createdAt: Date;
                phone: string;
                email: string | null;
                userType: import(".prisma/client").$Enums.UserType;
                status: import(".prisma/client").$Enums.UserStatus;
                isPhoneVerified: boolean;
                isEmailVerified: boolean;
                lastLoginAt: Date | null;
                clientProfile: {
                    fullName: string | null;
                    tenantId: string;
                } | null;
                spProfile: {
                    fullName: string | null;
                    spStatus: import(".prisma/client").$Enums.SpStatus;
                } | null;
                adminProfile: {
                    employeeId: string | null;
                    fullName: string | null;
                } | null;
            }[];
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
    getUserById(id: string): Promise<{
        data: {
            userRoles: ({
                role: {
                    rolePermissions: ({
                        permission: {
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
            } & {
                id: string;
                isActive: boolean;
                roleId: string;
                userId: string;
                tenantId: string | null;
                assignedById: string | null;
                assignedAt: Date;
                expiresAt: Date | null;
            })[];
            clientProfile: ({
                tenant: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    status: import(".prisma/client").$Enums.TenantStatus;
                    companyName: string;
                    segment: import(".prisma/client").$Enums.TenantSegment;
                    planTier: string;
                    walletBalance: import("@prisma/client/runtime/library").Decimal;
                    settings: import("@prisma/client/runtime/library").JsonValue | null;
                };
            } & {
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                fullName: string | null;
                department: string | null;
                tenantId: string;
                designation: string | null;
                clientRole: import(".prisma/client").$Enums.ClientRole;
            }) | null;
            spProfile: {
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                fullName: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                gender: string | null;
                dateOfBirth: Date | null;
                profilePhotoUrl: string | null;
                spStatus: import(".prisma/client").$Enums.SpStatus;
                behaviorScore: import("@prisma/client/runtime/library").Decimal;
                ratingAvg: import("@prisma/client/runtime/library").Decimal;
                totalCompleted: number;
            } | null;
            adminProfile: ({
                activeRole: {
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
                } | null;
            } & {
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                employeeId: string | null;
                fullName: string | null;
                department: string | null;
                activeRoleId: string | null;
            }) | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            phone: string;
            email: string | null;
            userType: import(".prisma/client").$Enums.UserType;
            status: import(".prisma/client").$Enums.UserStatus;
            isPhoneVerified: boolean;
            isEmailVerified: boolean;
            lastLoginAt: Date | null;
        };
        message: string;
    }>;
    updateUserStatus(id: string, dto: UpdateUserStatusDto, actor: JwtPayload): Promise<{
        data: {
            id: string;
            createdAt: Date;
            phone: string;
            email: string | null;
            userType: import(".prisma/client").$Enums.UserType;
            status: import(".prisma/client").$Enums.UserStatus;
            isPhoneVerified: boolean;
            isEmailVerified: boolean;
            lastLoginAt: Date | null;
            clientProfile: {
                fullName: string | null;
                tenantId: string;
            } | null;
            spProfile: {
                fullName: string | null;
                spStatus: import(".prisma/client").$Enums.SpStatus;
            } | null;
            adminProfile: {
                employeeId: string | null;
                fullName: string | null;
            } | null;
        };
        message: string;
    }>;
    createAdmin(dto: CreateAdminDto, actor: JwtPayload): Promise<{
        data: {
            id: string;
            createdAt: Date;
            phone: string;
            email: string | null;
            userType: import(".prisma/client").$Enums.UserType;
            status: import(".prisma/client").$Enums.UserStatus;
            isPhoneVerified: boolean;
            isEmailVerified: boolean;
            lastLoginAt: Date | null;
            clientProfile: {
                fullName: string | null;
                tenantId: string;
            } | null;
            spProfile: {
                fullName: string | null;
                spStatus: import(".prisma/client").$Enums.SpStatus;
            } | null;
            adminProfile: {
                employeeId: string | null;
                fullName: string | null;
            } | null;
        };
        message: string;
    }>;
}
