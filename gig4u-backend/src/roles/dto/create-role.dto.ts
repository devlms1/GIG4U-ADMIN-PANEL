import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';
import { UserType } from '@prisma/client';

export class CreateRoleDto {
  @IsString()
  @MinLength(3)
  @Matches(/^[A-Z][A-Z_]+$/, {
    message: 'name must be SCREAMING_SNAKE_CASE (e.g. MY_ROLE)',
  })
  name!: string;

  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(UserType)
  actorType!: UserType;

  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}
