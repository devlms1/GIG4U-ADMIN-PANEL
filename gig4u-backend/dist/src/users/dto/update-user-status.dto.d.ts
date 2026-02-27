import { UserStatus } from '@prisma/client';
export declare class UpdateUserStatusDto {
    status: UserStatus;
    reason?: string;
}
