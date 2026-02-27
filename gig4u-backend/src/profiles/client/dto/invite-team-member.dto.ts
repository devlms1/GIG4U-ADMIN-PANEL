import { IsEmail, IsEnum, IsString, Matches } from 'class-validator';
import { ClientRole } from '@prisma/client';

export class InviteTeamMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\d{10}$/, { message: 'Phone must be exactly 10 digits' })
  phone!: string;

  @IsEnum(ClientRole)
  clientRole!: ClientRole;
}
