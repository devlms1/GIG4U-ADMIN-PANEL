export type UserType = 'CLIENT' | 'SP' | 'ADMIN' | 'PARTNER';

export interface User {
  id: string;
  phone: string;
  email: string | null;
  userType: UserType;
  status: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  profile: Record<string, unknown> | null;
}

export interface RoleInfo {
  id: string;
  name: string;
  displayName: string | null;
}

export interface AuthSuccessData {
  user: User;
  accessToken: string;
  refreshToken: string;
  selectedRole?: RoleInfo;
}

export interface RoleSelectionData {
  requiresRoleSelection: true;
  availableRoles: RoleInfo[];
  tempToken: string;
}

export type LoginResponseData = AuthSuccessData | RoleSelectionData;

export interface MeResponseData extends User {
  roles: string[];
  permissions: string[];
  tenantId: string | null;
}

export function isRoleSelectionResponse(
  data: LoginResponseData,
): data is RoleSelectionData {
  return 'requiresRoleSelection' in data && data.requiresRoleSelection === true;
}
