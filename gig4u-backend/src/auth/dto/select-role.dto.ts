import { IsUUID } from 'class-validator';

export class SelectRoleDto {
  @IsUUID('4')
  roleId!: string;
}
