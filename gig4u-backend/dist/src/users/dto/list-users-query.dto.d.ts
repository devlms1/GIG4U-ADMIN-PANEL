import { UserType, UserStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto';
export declare class ListUsersQueryDto extends PaginationDto {
    userType?: UserType;
    status?: UserStatus;
    search?: string;
}
