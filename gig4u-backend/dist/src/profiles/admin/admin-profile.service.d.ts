import { AdminProfileRepository } from './admin-profile.repository';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
export declare class AdminProfileService {
    private readonly adminProfileRepo;
    constructor(adminProfileRepo: AdminProfileRepository);
    getOwnProfile(userId: string): Promise<{
        data: {
            user: {
                id: string;
                createdAt: Date;
                phone: string;
                email: string | null;
                userType: import(".prisma/client").$Enums.UserType;
                status: import(".prisma/client").$Enums.UserStatus;
                lastLoginAt: Date | null;
            };
            activeRole: {
                id: string;
                name: string;
                displayName: string | null;
            } | null;
        } & {
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            employeeId: string | null;
            fullName: string | null;
            department: string | null;
            activeRoleId: string | null;
        };
        message: string;
    }>;
    updateOwnProfile(userId: string, dto: UpdateAdminProfileDto): Promise<{
        data: {
            user: {
                id: string;
                createdAt: Date;
                phone: string;
                email: string | null;
                userType: import(".prisma/client").$Enums.UserType;
                status: import(".prisma/client").$Enums.UserStatus;
                lastLoginAt: Date | null;
            };
            activeRole: {
                id: string;
                name: string;
                displayName: string | null;
            } | null;
        } & {
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            employeeId: string | null;
            fullName: string | null;
            department: string | null;
            activeRoleId: string | null;
        };
        message: string;
    }>;
}
