import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  Matches,
  MinLength,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { UserType } from '@prisma/client';

export class SignupDto {
  @IsString()
  @Matches(/^\d{10}$/, { message: 'Phone must be exactly 10 digits' })
  phone!: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least 1 uppercase letter and 1 number',
  })
  password!: string;

  @IsEnum(UserType)
  userType!: UserType;

  @ValidateIf((o: SignupDto) => o.userType === UserType.CLIENT)
  @IsString()
  @IsNotEmpty({ message: 'companyName is required for CLIENT signup' })
  companyName?: string;
}
