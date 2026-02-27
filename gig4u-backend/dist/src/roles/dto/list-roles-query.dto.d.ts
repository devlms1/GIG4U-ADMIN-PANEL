import { UserType } from '@prisma/client';
import { PaginationDto } from '../../common/dto';
export declare class ListRolesQueryDto extends PaginationDto {
    actorType?: UserType;
    isActive?: boolean;
    search?: string;
}
