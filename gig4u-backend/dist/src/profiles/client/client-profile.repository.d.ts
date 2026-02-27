import { ClientRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
export declare class ClientProfileRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByUserId(userId: string): Promise<({
        user: {
            id: string;
            createdAt: Date;
            phone: string;
            email: string | null;
            userType: import(".prisma/client").$Enums.UserType;
            status: import(".prisma/client").$Enums.UserStatus;
            isPhoneVerified: boolean;
            isEmailVerified: boolean;
            lastLoginAt: Date | null;
        };
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
    }) | null>;
    update(userId: string, dto: UpdateClientProfileDto): Promise<{
        user: {
            id: string;
            createdAt: Date;
            phone: string;
            email: string | null;
            userType: import(".prisma/client").$Enums.UserType;
            status: import(".prisma/client").$Enums.UserStatus;
            isPhoneVerified: boolean;
            isEmailVerified: boolean;
            lastLoginAt: Date | null;
        };
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
    }>;
    findTeamByTenantId(tenantId: string): Promise<({
        user: {
            id: string;
            createdAt: Date;
            phone: string;
            email: string | null;
            status: import(".prisma/client").$Enums.UserStatus;
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
    })[]>;
    createTeamMember(data: {
        phone: string;
        email: string;
        tenantId: string;
        clientRole: ClientRole;
    }): Promise<{
        user: {
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
        };
        profile: {
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            fullName: string | null;
            department: string | null;
            tenantId: string;
            designation: string | null;
            clientRole: import(".prisma/client").$Enums.ClientRole;
        };
    }>;
    phoneExists(phone: string): Promise<boolean>;
}
