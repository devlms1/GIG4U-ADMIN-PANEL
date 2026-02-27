import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSpProfileDto } from './dto/update-sp-profile.dto';
export declare class SpProfileRepository {
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
    } & {
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
    }) | null>;
    findByUserIdWithRoles(userId: string): Promise<({
        user: {
            id: string;
            createdAt: Date;
            userRoles: ({
                role: {
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
            phone: string;
            email: string | null;
            userType: import(".prisma/client").$Enums.UserType;
            status: import(".prisma/client").$Enums.UserStatus;
            isPhoneVerified: boolean;
            isEmailVerified: boolean;
            lastLoginAt: Date | null;
        };
    } & {
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
    }) | null>;
    update(userId: string, dto: UpdateSpProfileDto): Promise<{
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
    } & {
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
    }>;
}
