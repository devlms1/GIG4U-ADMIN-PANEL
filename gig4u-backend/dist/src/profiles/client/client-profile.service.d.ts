import { ClientProfileRepository } from './client-profile.repository';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import type { JwtPayload } from '../../common/types';
export declare class ClientProfileService {
    private readonly clientProfileRepo;
    constructor(clientProfileRepo: ClientProfileRepository);
    getOwnProfile(userId: string): Promise<{
        data: {
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
        };
        message: string;
    }>;
    updateOwnProfile(userId: string, dto: UpdateClientProfileDto): Promise<{
        data: {
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
        };
        message: string;
    }>;
    getTeam(currentUser: JwtPayload): Promise<{
        data: ({
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
        })[];
        message: string;
    }>;
    inviteTeamMember(currentUser: JwtPayload, dto: InviteTeamMemberDto): Promise<{
        data: {
            user: {
                id: string;
                phone: string;
                email: string | null;
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
        };
        message: string;
    }>;
}
