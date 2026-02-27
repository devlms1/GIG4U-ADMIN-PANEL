import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserType } from '@prisma/client';
import { PaginationDto } from '../../common/dto';

export class ListRolesQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserType)
  actorType?: UserType;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
