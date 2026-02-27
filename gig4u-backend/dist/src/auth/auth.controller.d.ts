import { AuthService } from './auth.service';
import { SignupDto, LoginDto, SelectRoleDto, RefreshTokenDto } from './dto';
import type { JwtPayload } from '../common/types';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(dto: SignupDto): Promise<{
        data: {
            accessToken: string;
            refreshToken: string;
            user: {
                id: string;
                phone: string;
                email: string | null;
                userType: import(".prisma/client").$Enums.UserType;
                status: string;
                isPhoneVerified: boolean;
                isEmailVerified: boolean;
                lastLoginAt: string | null;
                createdAt: string;
                profile: {} | null;
            };
        };
        message: string;
    }>;
    login(dto: LoginDto): Promise<{
        data: {
            selectedRole: {
                id: string;
                name: string;
                displayName: string | null;
            };
            accessToken: string;
            refreshToken: string;
            user: {
                id: string;
                phone: string;
                email: string | null;
                userType: import(".prisma/client").$Enums.UserType;
                status: string;
                isPhoneVerified: boolean;
                isEmailVerified: boolean;
                lastLoginAt: string | null;
                createdAt: string;
                profile: {} | null;
            };
            requiresRoleSelection?: undefined;
            availableRoles?: undefined;
            tempToken?: undefined;
        };
        message: string;
    } | {
        data: {
            requiresRoleSelection: boolean;
            availableRoles: {
                id: string;
                name: string;
                displayName: string | null;
            }[];
            tempToken: string;
        };
        message: string;
    } | {
        data: {
            accessToken: string;
            refreshToken: string;
            user: {
                id: string;
                phone: string;
                email: string | null;
                userType: import(".prisma/client").$Enums.UserType;
                status: string;
                isPhoneVerified: boolean;
                isEmailVerified: boolean;
                lastLoginAt: string | null;
                createdAt: string;
                profile: {} | null;
            };
            requiresRoleSelection?: undefined;
            availableRoles?: undefined;
            tempToken?: undefined;
        };
        message: string;
    }>;
    selectRole(dto: SelectRoleDto, authHeader: string): Promise<{
        data: {
            selectedRole: {
                id: string;
                name: string;
                displayName: string | null;
            };
            accessToken: string;
            refreshToken: string;
        };
        message: string;
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        data: {
            accessToken: string;
            refreshToken: string;
        };
        message: string;
    }>;
    logout(user: JwtPayload): Promise<{
        data: null;
        message: string;
    }>;
    getMe(user: JwtPayload): Promise<{
        data: {
            roles: string[];
            permissions: string[];
            tenantId: string | null;
            id: string;
            phone: string;
            email: string | null;
            userType: import(".prisma/client").$Enums.UserType;
            status: string;
            isPhoneVerified: boolean;
            isEmailVerified: boolean;
            lastLoginAt: string | null;
            createdAt: string;
            profile: {} | null;
        };
        message: string;
    }>;
}
