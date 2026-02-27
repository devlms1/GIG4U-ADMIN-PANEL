import { UserType } from '@prisma/client';
export declare class SignupDto {
    phone: string;
    email?: string;
    password: string;
    userType: UserType;
    companyName?: string;
}
