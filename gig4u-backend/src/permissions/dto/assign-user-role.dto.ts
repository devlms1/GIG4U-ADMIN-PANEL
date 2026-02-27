import { IsUUID, IsOptional, IsDateString } from 'class-validator';

export class AssignUserRoleDto {
  @IsUUID('4')
  roleId!: string;

  @IsOptional()
  @IsUUID('4')
  tenantId?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
