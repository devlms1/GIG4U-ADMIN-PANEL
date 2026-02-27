import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export const profileApi = {
  async getSpProfile() {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>('/sp/profile');
    return data;
  },

  async updateSpProfile(payload: Record<string, string>) {
    const { data } = await apiClient.patch<ApiResponse<Record<string, unknown>>>('/sp/profile', payload);
    return data;
  },

  async getClientProfile() {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>('/client/profile');
    return data;
  },

  async updateClientProfile(payload: Record<string, string>) {
    const { data } = await apiClient.patch<ApiResponse<Record<string, unknown>>>('/client/profile', payload);
    return data;
  },

  async getClientTeam() {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>[]>>('/client/team');
    return data;
  },

  async inviteTeamMember(payload: { email: string; phone: string; clientRole: string }) {
    const { data } = await apiClient.post<ApiResponse<Record<string, unknown>>>('/client/team/invite', payload);
    return data;
  },

  async getAdminProfile() {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>('/admin/profile');
    return data;
  },

  async updateAdminProfile(payload: Record<string, string>) {
    const { data } = await apiClient.patch<ApiResponse<Record<string, unknown>>>('/admin/profile', payload);
    return data;
  },
};
