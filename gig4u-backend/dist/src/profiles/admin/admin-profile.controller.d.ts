import { AdminProfileService } from './admin-profile.service';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import type { JwtPayload } from '../../common/types';
export declare class AdminProfileController {
    private readonly adminProfileService;
    constructor(adminProfileService: AdminProfileService);
    getOwnProfile(user: JwtPayload): Promise<{
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
    updateOwnProfile(user: JwtPayload, dto: UpdateAdminProfileDto): Promise<{
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
