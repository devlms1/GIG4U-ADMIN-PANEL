import { Prisma, RefreshToken } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findUserByPhone(phone: string): Promise<({
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
                walletBalance: Prisma.Decimal;
                settings: Prisma.JsonValue | null;
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
            behaviorScore: Prisma.Decimal;
            ratingAvg: Prisma.Decimal;
            totalCompleted: number;
        } | null;
        adminProfile: {
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            employeeId: string | null;
            fullName: string | null;
            department: string | null;
            activeRoleId: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        phone: string;
        email: string | null;
        passwordHash: string | null;
        userType: import(".prisma/client").$Enums.UserType;
        status: import(".prisma/client").$Enums.UserStatus;
        isPhoneVerified: boolean;
        isEmailVerified: boolean;
        lastLoginAt: Date | null;
    }) | null>;
    findUserById(userId: string): Promise<({
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
                walletBalance: Prisma.Decimal;
                settings: Prisma.JsonValue | null;
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
            behaviorScore: Prisma.Decimal;
            ratingAvg: Prisma.Decimal;
            totalCompleted: number;
        } | null;
        adminProfile: {
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            employeeId: string | null;
            fullName: string | null;
            department: string | null;
            activeRoleId: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        phone: string;
        email: string | null;
        passwordHash: string | null;
        userType: import(".prisma/client").$Enums.UserType;
        status: import(".prisma/client").$Enums.UserStatus;
        isPhoneVerified: boolean;
        isEmailVerified: boolean;
        lastLoginAt: Date | null;
    }) | null>;
    phoneExists(phone: string): Promise<boolean>;
    updateLastLogin(userId: string): Promise<void>;
    createClientUser(data: {
        phone: string;
        email?: string;
        passwordHash: string;
        companyName: string;
    }): Promise<{
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
                walletBalance: Prisma.Decimal;
                settings: Prisma.JsonValue | null;
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
            behaviorScore: Prisma.Decimal;
            ratingAvg: Prisma.Decimal;
            totalCompleted: number;
        } | null;
        adminProfile: {
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            employeeId: string | null;
            fullName: string | null;
            department: string | null;
            activeRoleId: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        phone: string;
        email: string | null;
        passwordHash: string | null;
        userType: import(".prisma/client").$Enums.UserType;
        status: import(".prisma/client").$Enums.UserStatus;
        isPhoneVerified: boolean;
        isEmailVerified: boolean;
        lastLoginAt: Date | null;
    }>;
    createSpUser(data: {
        phone: string;
        email?: string;
        passwordHash: string;
    }): Promise<{
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
                walletBalance: Prisma.Decimal;
                settings: Prisma.JsonValue | null;
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
            behaviorScore: Prisma.Decimal;
            ratingAvg: Prisma.Decimal;
            totalCompleted: number;
        } | null;
        adminProfile: {
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            employeeId: string | null;
            fullName: string | null;
            department: string | null;
            activeRoleId: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        phone: string;
        email: string | null;
        passwordHash: string | null;
        userType: import(".prisma/client").$Enums.UserType;
        status: import(".prisma/client").$Enums.UserStatus;
        isPhoneVerified: boolean;
        isEmailVerified: boolean;
        lastLoginAt: Date | null;
    }>;
    createRefreshToken(data: {
        userId: string;
        tokenHash: string;
        expiresAt: Date;
        ipAddress?: string;
    }): Promise<RefreshToken>;
    findRefreshToken(tokenHash: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        expiresAt: Date;
        tokenHash: string;
        deviceInfo: Prisma.JsonValue | null;
        ipAddress: string | null;
        revokedAt: Date | null;
    } | null>;
    revokeRefreshToken(tokenId: string): Promise<void>;
    revokeAllUserRefreshTokens(userId: string): Promise<void>;
    findAdminRolesForUser(userId: string): Promise<({
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
    })[]>;
    userHasRole(userId: string, roleId: string): Promise<boolean>;
    findPermissionsForRole(roleId: string): Promise<string[]>;
    createAdminSession(data: {
        userId: string;
        selectedRoleId: string;
        jwtJti: string;
        expiresAt: Date;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        expiresAt: Date;
        ipAddress: string | null;
        jwtJti: string;
        userAgent: string | null;
        terminatedAt: Date | null;
        selectedRoleId: string;
    }>;
    terminateAdminSessions(userId: string): Promise<void>;
    findRoleById(roleId: string): Promise<({
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
    }) | null>;
}
