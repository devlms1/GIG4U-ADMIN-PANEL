import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
export declare class AdminProfileRepository {
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
    }) | null>;
    update(userId: string, dto: UpdateAdminProfileDto): Promise<{
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
    }>;
}
