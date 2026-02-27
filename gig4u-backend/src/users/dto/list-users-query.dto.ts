import { IsOptional, IsEnum, IsString } from 'class-validator';
import { UserType, UserStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto';

export class ListUsersQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
