import { UserType } from '@prisma/client';
export interface JwtPayload {
    sub: string;
    userType: UserType;
    roles: string[];
    permissions: string[];
    tenantId: string | null;
    jti?: string;
}
export interface TempTokenPayload {
    sub: string;
    purpose: 'role_selection';
}
