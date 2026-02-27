import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type {
  AuthSuccessData,
  LoginResponseData,
  MeResponseData,
} from '@/types/user';

interface SignupPayload {
  phone: string;
  email?: string;
  password: string;
  userType: 'CLIENT' | 'SP';
  companyName?: string;
}

interface LoginPayload {
  phone: string;
  password: string;
}

interface SelectRolePayload {
  roleId: string;
}

export const authApi = {
  async signup(payload: SignupPayload) {
    const { data } = await apiClient.post<ApiResponse<AuthSuccessData>>(
      '/auth/signup',
      payload,
    );
    return data;
  },

  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<ApiResponse<LoginResponseData>>(
      '/auth/login',
      payload,
    );
    return data;
  },

  async selectRole(payload: SelectRolePayload, tempToken: string) {
    const { data } = await apiClient.post<
      ApiResponse<{ accessToken: string; refreshToken: string; selectedRole: { id: string; name: string; displayName: string | null } }>
    >('/auth/admin/select-role', payload, {
      headers: { Authorization: `Bearer ${tempToken}` },
    });
    return data;
  },

  async refresh(refreshToken: string) {
    const { data } = await apiClient.post<
      ApiResponse<{ accessToken: string; refreshToken: string }>
    >('/auth/refresh', { refreshToken });
    return data;
  },

  async logout() {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return data;
  },

  async getMe() {
    const { data } =
      await apiClient.get<ApiResponse<MeResponseData>>('/auth/me');
    return data;
  },
};
